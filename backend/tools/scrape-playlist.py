#!/usr/bin/env python3
"""
Scrape all videos from a YouTube playlist.
Output: JSON array of {index, videoId, title, url} sorted by playlist position.
"""

import urllib.request
import urllib.parse
import json
import re
import sys
import time

def fetch_page(url, retries=3):
    """Fetch a URL with retries."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    req = urllib.request.Request(url, headers=headers)
    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=15)
            return resp.read().decode('utf-8')
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                raise e

def extract_yt_initial_data(html):
    """Extract ytInitialData JSON from YouTube HTML page."""
    m = re.search(r'var ytInitialData\s*=\s*', html)
    if not m:
        return None
    start = m.end()
    decoder = json.JSONDecoder()
    data, _ = decoder.raw_decode(html, start)
    return data

def extract_videos_from_lockup_items(items):
    """Extract video info from lockupViewModel items."""
    videos = []
    for item in items:
        lockup = item.get('lockupViewModel', {})
        if not lockup:
            continue
        
        content_id = lockup.get('contentId', '')
        content_type = lockup.get('contentType', '')
        
        # Only process videos
        if content_type != 'LOCKUP_CONTENT_TYPE_VIDEO' or not content_id:
            continue
        
        # Extract title
        title = ''
        metadata = lockup.get('metadata', {})
        lockup_meta = metadata.get('lockupMetadataViewModel', {})
        title_obj = lockup_meta.get('title', {})
        title = title_obj.get('content', '')
        
        # Extract playlist index from rendererContext
        index = -1
        ctx = lockup.get('rendererContext', {})
        cmd_ctx = ctx.get('commandContext', {})
        onTap = cmd_ctx.get('onTap', {})
        innertube = onTap.get('innertubeCommand', {})
        watch_ep = innertube.get('watchEndpoint', {})
        index = watch_ep.get('index', -1)
        
        if content_id and title:
            url = f'https://www.youtube.com/watch?v={content_id}'
            videos.append({
                'index': index,
                'videoId': content_id,
                'title': title,
                'url': url,
            })
    
    return videos

def extract_continuation_token(data):
    """Extract the continuation token for next page."""
    try:
        tabs = data.get('contents', {}).get('twoColumnBrowseResultsRenderer', {}).get('tabs', [])
        for tab in tabs:
            content = tab.get('tabRenderer', {}).get('content', {})
            sects = content.get('sectionListRenderer', {}).get('contents', [])
            for s in sects:
                # Check itemSectionRenderer
                isr = s.get('itemSectionRenderer', {})
                continuation_items = isr.get('contents', [])
                for ci in continuation_items:
                    civm = ci.get('continuationItemViewModel', {})
                    if civm:
                        endpoint = civm.get('continuationEndpoint', {})
                        token = endpoint.get('continuationCommand', {}).get('token', '')
                        if token:
                            return token
                
                # Check continuationItemRenderer (older format)
                cir = s.get('continuationItemRenderer', {})
                if cir:
                    ep = cir.get('continuationEndpoint', {})
                    token = ep.get('continuationCommand', {}).get('token', '')
                    if token:
                        return token
    except Exception:
        pass
    return None

def fetch_continuation(continuation_token):
    """Fetch next page of playlist using continuation token."""
    url = 'https://www.youtube.com/youtubei/v1/browse'
    payload = {
        'context': {
            'client': {
                'clientName': 'WEB',
                'clientVersion': '2.20240101.00.00',
            }
        },
        'continuation': continuation_token,
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read().decode('utf-8'))

def extract_videos_from_continuation(data):
    """Extract videos from continuation response."""
    videos = []
    try:
        # Navigate continuation response
        actions = data.get('onResponseReceivedActions', [])
        for action in actions:
            # appendContinuationItemsAction
            append = action.get('appendContinuationItemsAction', {})
            contents = append.get('continuationItems', [])
            for item in contents:
                lockup = item.get('lockupViewModel', {})
                if not lockup:
                    continue
                
                content_id = lockup.get('contentId', '')
                content_type = lockup.get('contentType', '')
                
                if content_type != 'LOCKUP_CONTENT_TYPE_VIDEO' or not content_id:
                    continue
                
                title = ''
                metadata = lockup.get('metadata', {})
                lockup_meta = metadata.get('lockupMetadataViewModel', {})
                title_obj = lockup_meta.get('title', {})
                title = title_obj.get('content', '')
                
                index = -1
                ctx = lockup.get('rendererContext', {})
                cmd_ctx = ctx.get('commandContext', {})
                onTap = cmd_ctx.get('onTap', {})
                innertube = onTap.get('innertubeCommand', {})
                watch_ep = innertube.get('watchEndpoint', {})
                index = watch_ep.get('index', -1)
                
                if content_id and title:
                    url = f'https://www.youtube.com/watch?v={content_id}'
                    videos.append({
                        'index': index,
                        'videoId': content_id,
                        'title': title,
                        'url': url,
                    })
            
            # Check for next continuation token
            for item in contents:
                civm = item.get('continuationItemViewModel', {})
                if civm:
                    ep = civm.get('continuationEndpoint', {})
                    token = ep.get('continuationCommand', {}).get('token', '')
                    if token:
                        return videos, token
    except Exception as e:
        print(f'Error parsing continuation: {e}', file=sys.stderr)
    
    return videos, None

def main():
    playlist_id = sys.argv[1] if len(sys.argv) > 1 else 'PLQr_uaxVWO-4'
    
    all_videos = []
    seen_ids = set()
    
    # Fetch first page
    url = f'https://www.youtube.com/playlist?list={playlist_id}'
    print(f'Fetching playlist: {playlist_id}', file=sys.stderr)
    html = fetch_page(url)
    data = extract_yt_initial_data(html)
    
    if not data:
        print('ERROR: Could not extract ytInitialData', file=sys.stderr)
        sys.exit(1)
    
    # Extract videos from first page
    tabs = data.get('contents', {}).get('twoColumnBrowseResultsRenderer', {}).get('tabs', [])
    for tab in tabs:
        content = tab.get('tabRenderer', {}).get('content', {})
        sects = content.get('sectionListRenderer', {}).get('contents', [])
        for s in sects:
            isr = s.get('itemSectionRenderer', {})
            items = isr.get('contents', [])
            videos = extract_videos_from_lockup_items(items)
            for v in videos:
                if v['videoId'] not in seen_ids:
                    all_videos.append(v)
                    seen_ids.add(v['videoId'])
    
    # Check for continuation token
    continuation_token = extract_continuation_token(data)
    
    page = 1
    while continuation_token:
        page += 1
        print(f'Fetching page {page}...', file=sys.stderr)
        time.sleep(1)  # Rate limiting
        try:
            cont_data = fetch_continuation(continuation_token)
            videos, next_token = extract_videos_from_continuation(cont_data)
            for v in videos:
                if v['videoId'] not in seen_ids:
                    all_videos.append(v)
                    seen_ids.add(v['videoId'])
            continuation_token = next_token
        except Exception as e:
            print(f'Error fetching page {page}: {e}', file=sys.stderr)
            break
    
    # Sort by index (playlist position)
    all_videos.sort(key=lambda v: v['index'] if v['index'] >= 0 else 999999)
    
    # Re-index starting from 1
    for i, v in enumerate(all_videos):
        v['index'] = i + 1
    
    print(f'\nTotal videos found: {len(all_videos)}', file=sys.stderr)
    
    # Output JSON to stdout
    print(json.dumps(all_videos, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
