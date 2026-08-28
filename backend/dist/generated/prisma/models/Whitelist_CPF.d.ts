import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model Whitelist_CPF
 *
 */
export type Whitelist_CPFModel = runtime.Types.Result.DefaultSelection<Prisma.$Whitelist_CPFPayload>;
export type AggregateWhitelist_CPF = {
    _count: Whitelist_CPFCountAggregateOutputType | null;
    _min: Whitelist_CPFMinAggregateOutputType | null;
    _max: Whitelist_CPFMaxAggregateOutputType | null;
};
export type Whitelist_CPFMinAggregateOutputType = {
    cpf: string | null;
    role: $Enums.Role | null;
};
export type Whitelist_CPFMaxAggregateOutputType = {
    cpf: string | null;
    role: $Enums.Role | null;
};
export type Whitelist_CPFCountAggregateOutputType = {
    cpf: number;
    role: number;
    _all: number;
};
export type Whitelist_CPFMinAggregateInputType = {
    cpf?: true;
    role?: true;
};
export type Whitelist_CPFMaxAggregateInputType = {
    cpf?: true;
    role?: true;
};
export type Whitelist_CPFCountAggregateInputType = {
    cpf?: true;
    role?: true;
    _all?: true;
};
export type Whitelist_CPFAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Whitelist_CPF to aggregate.
     */
    where?: Prisma.Whitelist_CPFWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Whitelist_CPFS to fetch.
     */
    orderBy?: Prisma.Whitelist_CPFOrderByWithRelationInput | Prisma.Whitelist_CPFOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.Whitelist_CPFWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Whitelist_CPFS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Whitelist_CPFS.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Whitelist_CPFS
    **/
    _count?: true | Whitelist_CPFCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: Whitelist_CPFMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: Whitelist_CPFMaxAggregateInputType;
};
export type GetWhitelist_CPFAggregateType<T extends Whitelist_CPFAggregateArgs> = {
    [P in keyof T & keyof AggregateWhitelist_CPF]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWhitelist_CPF[P]> : Prisma.GetScalarType<T[P], AggregateWhitelist_CPF[P]>;
};
export type Whitelist_CPFGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.Whitelist_CPFWhereInput;
    orderBy?: Prisma.Whitelist_CPFOrderByWithAggregationInput | Prisma.Whitelist_CPFOrderByWithAggregationInput[];
    by: Prisma.Whitelist_CPFScalarFieldEnum[] | Prisma.Whitelist_CPFScalarFieldEnum;
    having?: Prisma.Whitelist_CPFScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: Whitelist_CPFCountAggregateInputType | true;
    _min?: Whitelist_CPFMinAggregateInputType;
    _max?: Whitelist_CPFMaxAggregateInputType;
};
export type Whitelist_CPFGroupByOutputType = {
    cpf: string;
    role: $Enums.Role;
    _count: Whitelist_CPFCountAggregateOutputType | null;
    _min: Whitelist_CPFMinAggregateOutputType | null;
    _max: Whitelist_CPFMaxAggregateOutputType | null;
};
export type GetWhitelist_CPFGroupByPayload<T extends Whitelist_CPFGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<Whitelist_CPFGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof Whitelist_CPFGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], Whitelist_CPFGroupByOutputType[P]> : Prisma.GetScalarType<T[P], Whitelist_CPFGroupByOutputType[P]>;
}>>;
export type Whitelist_CPFWhereInput = {
    AND?: Prisma.Whitelist_CPFWhereInput | Prisma.Whitelist_CPFWhereInput[];
    OR?: Prisma.Whitelist_CPFWhereInput[];
    NOT?: Prisma.Whitelist_CPFWhereInput | Prisma.Whitelist_CPFWhereInput[];
    cpf?: Prisma.StringFilter<"Whitelist_CPF"> | string;
    role?: Prisma.EnumRoleFilter<"Whitelist_CPF"> | $Enums.Role;
};
export type Whitelist_CPFOrderByWithRelationInput = {
    cpf?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    _relevance?: Prisma.Whitelist_CPFOrderByRelevanceInput;
};
export type Whitelist_CPFWhereUniqueInput = Prisma.AtLeast<{
    cpf?: string;
    AND?: Prisma.Whitelist_CPFWhereInput | Prisma.Whitelist_CPFWhereInput[];
    OR?: Prisma.Whitelist_CPFWhereInput[];
    NOT?: Prisma.Whitelist_CPFWhereInput | Prisma.Whitelist_CPFWhereInput[];
    role?: Prisma.EnumRoleFilter<"Whitelist_CPF"> | $Enums.Role;
}, "cpf">;
export type Whitelist_CPFOrderByWithAggregationInput = {
    cpf?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    _count?: Prisma.Whitelist_CPFCountOrderByAggregateInput;
    _max?: Prisma.Whitelist_CPFMaxOrderByAggregateInput;
    _min?: Prisma.Whitelist_CPFMinOrderByAggregateInput;
};
export type Whitelist_CPFScalarWhereWithAggregatesInput = {
    AND?: Prisma.Whitelist_CPFScalarWhereWithAggregatesInput | Prisma.Whitelist_CPFScalarWhereWithAggregatesInput[];
    OR?: Prisma.Whitelist_CPFScalarWhereWithAggregatesInput[];
    NOT?: Prisma.Whitelist_CPFScalarWhereWithAggregatesInput | Prisma.Whitelist_CPFScalarWhereWithAggregatesInput[];
    cpf?: Prisma.StringWithAggregatesFilter<"Whitelist_CPF"> | string;
    role?: Prisma.EnumRoleWithAggregatesFilter<"Whitelist_CPF"> | $Enums.Role;
};
export type Whitelist_CPFCreateInput = {
    cpf: string;
    role: $Enums.Role;
};
export type Whitelist_CPFUncheckedCreateInput = {
    cpf: string;
    role: $Enums.Role;
};
export type Whitelist_CPFUpdateInput = {
    cpf?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumRoleFieldUpdateOperationsInput | $Enums.Role;
};
export type Whitelist_CPFUncheckedUpdateInput = {
    cpf?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumRoleFieldUpdateOperationsInput | $Enums.Role;
};
export type Whitelist_CPFCreateManyInput = {
    cpf: string;
    role: $Enums.Role;
};
export type Whitelist_CPFUpdateManyMutationInput = {
    cpf?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumRoleFieldUpdateOperationsInput | $Enums.Role;
};
export type Whitelist_CPFUncheckedUpdateManyInput = {
    cpf?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.EnumRoleFieldUpdateOperationsInput | $Enums.Role;
};
export type Whitelist_CPFOrderByRelevanceInput = {
    fields: Prisma.Whitelist_CPFOrderByRelevanceFieldEnum | Prisma.Whitelist_CPFOrderByRelevanceFieldEnum[];
    sort: Prisma.SortOrder;
    search: string;
};
export type Whitelist_CPFCountOrderByAggregateInput = {
    cpf?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
};
export type Whitelist_CPFMaxOrderByAggregateInput = {
    cpf?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
};
export type Whitelist_CPFMinOrderByAggregateInput = {
    cpf?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
};
export type Whitelist_CPFSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    cpf?: boolean;
    role?: boolean;
}, ExtArgs["result"]["whitelist_CPF"]>;
export type Whitelist_CPFSelectScalar = {
    cpf?: boolean;
    role?: boolean;
};
export type Whitelist_CPFOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"cpf" | "role", ExtArgs["result"]["whitelist_CPF"]>;
export type $Whitelist_CPFPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Whitelist_CPF";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        cpf: string;
        role: $Enums.Role;
    }, ExtArgs["result"]["whitelist_CPF"]>;
    composites: {};
};
export type Whitelist_CPFGetPayload<S extends boolean | null | undefined | Whitelist_CPFDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload, S>;
export type Whitelist_CPFCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<Whitelist_CPFFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: Whitelist_CPFCountAggregateInputType | true;
};
export interface Whitelist_CPFDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Whitelist_CPF'];
        meta: {
            name: 'Whitelist_CPF';
        };
    };
    /**
     * Find zero or one Whitelist_CPF that matches the filter.
     * @param {Whitelist_CPFFindUniqueArgs} args - Arguments to find a Whitelist_CPF
     * @example
     * // Get one Whitelist_CPF
     * const whitelist_CPF = await prisma.whitelist_CPF.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends Whitelist_CPFFindUniqueArgs>(args: Prisma.SelectSubset<T, Whitelist_CPFFindUniqueArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Whitelist_CPF that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {Whitelist_CPFFindUniqueOrThrowArgs} args - Arguments to find a Whitelist_CPF
     * @example
     * // Get one Whitelist_CPF
     * const whitelist_CPF = await prisma.whitelist_CPF.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends Whitelist_CPFFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, Whitelist_CPFFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Whitelist_CPF that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Whitelist_CPFFindFirstArgs} args - Arguments to find a Whitelist_CPF
     * @example
     * // Get one Whitelist_CPF
     * const whitelist_CPF = await prisma.whitelist_CPF.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends Whitelist_CPFFindFirstArgs>(args?: Prisma.SelectSubset<T, Whitelist_CPFFindFirstArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Whitelist_CPF that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Whitelist_CPFFindFirstOrThrowArgs} args - Arguments to find a Whitelist_CPF
     * @example
     * // Get one Whitelist_CPF
     * const whitelist_CPF = await prisma.whitelist_CPF.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends Whitelist_CPFFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, Whitelist_CPFFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Whitelist_CPFS that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Whitelist_CPFFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Whitelist_CPFS
     * const whitelist_CPFS = await prisma.whitelist_CPF.findMany()
     *
     * // Get first 10 Whitelist_CPFS
     * const whitelist_CPFS = await prisma.whitelist_CPF.findMany({ take: 10 })
     *
     * // Only select the `cpf`
     * const whitelist_CPFWithCpfOnly = await prisma.whitelist_CPF.findMany({ select: { cpf: true } })
     *
     */
    findMany<T extends Whitelist_CPFFindManyArgs>(args?: Prisma.SelectSubset<T, Whitelist_CPFFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Whitelist_CPF.
     * @param {Whitelist_CPFCreateArgs} args - Arguments to create a Whitelist_CPF.
     * @example
     * // Create one Whitelist_CPF
     * const Whitelist_CPF = await prisma.whitelist_CPF.create({
     *   data: {
     *     // ... data to create a Whitelist_CPF
     *   }
     * })
     *
     */
    create<T extends Whitelist_CPFCreateArgs>(args: Prisma.SelectSubset<T, Whitelist_CPFCreateArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Whitelist_CPFS.
     * @param {Whitelist_CPFCreateManyArgs} args - Arguments to create many Whitelist_CPFS.
     * @example
     * // Create many Whitelist_CPFS
     * const whitelist_CPF = await prisma.whitelist_CPF.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends Whitelist_CPFCreateManyArgs>(args?: Prisma.SelectSubset<T, Whitelist_CPFCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Delete a Whitelist_CPF.
     * @param {Whitelist_CPFDeleteArgs} args - Arguments to delete one Whitelist_CPF.
     * @example
     * // Delete one Whitelist_CPF
     * const Whitelist_CPF = await prisma.whitelist_CPF.delete({
     *   where: {
     *     // ... filter to delete one Whitelist_CPF
     *   }
     * })
     *
     */
    delete<T extends Whitelist_CPFDeleteArgs>(args: Prisma.SelectSubset<T, Whitelist_CPFDeleteArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Whitelist_CPF.
     * @param {Whitelist_CPFUpdateArgs} args - Arguments to update one Whitelist_CPF.
     * @example
     * // Update one Whitelist_CPF
     * const whitelist_CPF = await prisma.whitelist_CPF.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends Whitelist_CPFUpdateArgs>(args: Prisma.SelectSubset<T, Whitelist_CPFUpdateArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Whitelist_CPFS.
     * @param {Whitelist_CPFDeleteManyArgs} args - Arguments to filter Whitelist_CPFS to delete.
     * @example
     * // Delete a few Whitelist_CPFS
     * const { count } = await prisma.whitelist_CPF.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends Whitelist_CPFDeleteManyArgs>(args?: Prisma.SelectSubset<T, Whitelist_CPFDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Whitelist_CPFS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Whitelist_CPFUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Whitelist_CPFS
     * const whitelist_CPF = await prisma.whitelist_CPF.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends Whitelist_CPFUpdateManyArgs>(args: Prisma.SelectSubset<T, Whitelist_CPFUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create or update one Whitelist_CPF.
     * @param {Whitelist_CPFUpsertArgs} args - Arguments to update or create a Whitelist_CPF.
     * @example
     * // Update or create a Whitelist_CPF
     * const whitelist_CPF = await prisma.whitelist_CPF.upsert({
     *   create: {
     *     // ... data to create a Whitelist_CPF
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Whitelist_CPF we want to update
     *   }
     * })
     */
    upsert<T extends Whitelist_CPFUpsertArgs>(args: Prisma.SelectSubset<T, Whitelist_CPFUpsertArgs<ExtArgs>>): Prisma.Prisma__Whitelist_CPFClient<runtime.Types.Result.GetResult<Prisma.$Whitelist_CPFPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Whitelist_CPFS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Whitelist_CPFCountArgs} args - Arguments to filter Whitelist_CPFS to count.
     * @example
     * // Count the number of Whitelist_CPFS
     * const count = await prisma.whitelist_CPF.count({
     *   where: {
     *     // ... the filter for the Whitelist_CPFS we want to count
     *   }
     * })
    **/
    count<T extends Whitelist_CPFCountArgs>(args?: Prisma.Subset<T, Whitelist_CPFCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], Whitelist_CPFCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Whitelist_CPF.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Whitelist_CPFAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Whitelist_CPFAggregateArgs>(args: Prisma.Subset<T, Whitelist_CPFAggregateArgs>): Prisma.PrismaPromise<GetWhitelist_CPFAggregateType<T>>;
    /**
     * Group by Whitelist_CPF.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Whitelist_CPFGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends Whitelist_CPFGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: Whitelist_CPFGroupByArgs['orderBy'];
    } : {
        orderBy?: Whitelist_CPFGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, Whitelist_CPFGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWhitelist_CPFGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Whitelist_CPF model
     */
    readonly fields: Whitelist_CPFFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Whitelist_CPF.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__Whitelist_CPFClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the Whitelist_CPF model
 */
export interface Whitelist_CPFFieldRefs {
    readonly cpf: Prisma.FieldRef<"Whitelist_CPF", 'String'>;
    readonly role: Prisma.FieldRef<"Whitelist_CPF", 'Role'>;
}
/**
 * Whitelist_CPF findUnique
 */
export type Whitelist_CPFFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * Filter, which Whitelist_CPF to fetch.
     */
    where: Prisma.Whitelist_CPFWhereUniqueInput;
};
/**
 * Whitelist_CPF findUniqueOrThrow
 */
export type Whitelist_CPFFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * Filter, which Whitelist_CPF to fetch.
     */
    where: Prisma.Whitelist_CPFWhereUniqueInput;
};
/**
 * Whitelist_CPF findFirst
 */
export type Whitelist_CPFFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * Filter, which Whitelist_CPF to fetch.
     */
    where?: Prisma.Whitelist_CPFWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Whitelist_CPFS to fetch.
     */
    orderBy?: Prisma.Whitelist_CPFOrderByWithRelationInput | Prisma.Whitelist_CPFOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Whitelist_CPFS.
     */
    cursor?: Prisma.Whitelist_CPFWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Whitelist_CPFS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Whitelist_CPFS.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Whitelist_CPFS.
     */
    distinct?: Prisma.Whitelist_CPFScalarFieldEnum | Prisma.Whitelist_CPFScalarFieldEnum[];
};
/**
 * Whitelist_CPF findFirstOrThrow
 */
export type Whitelist_CPFFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * Filter, which Whitelist_CPF to fetch.
     */
    where?: Prisma.Whitelist_CPFWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Whitelist_CPFS to fetch.
     */
    orderBy?: Prisma.Whitelist_CPFOrderByWithRelationInput | Prisma.Whitelist_CPFOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Whitelist_CPFS.
     */
    cursor?: Prisma.Whitelist_CPFWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Whitelist_CPFS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Whitelist_CPFS.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Whitelist_CPFS.
     */
    distinct?: Prisma.Whitelist_CPFScalarFieldEnum | Prisma.Whitelist_CPFScalarFieldEnum[];
};
/**
 * Whitelist_CPF findMany
 */
export type Whitelist_CPFFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * Filter, which Whitelist_CPFS to fetch.
     */
    where?: Prisma.Whitelist_CPFWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Whitelist_CPFS to fetch.
     */
    orderBy?: Prisma.Whitelist_CPFOrderByWithRelationInput | Prisma.Whitelist_CPFOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Whitelist_CPFS.
     */
    cursor?: Prisma.Whitelist_CPFWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Whitelist_CPFS from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Whitelist_CPFS.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Whitelist_CPFS.
     */
    distinct?: Prisma.Whitelist_CPFScalarFieldEnum | Prisma.Whitelist_CPFScalarFieldEnum[];
};
/**
 * Whitelist_CPF create
 */
export type Whitelist_CPFCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * The data needed to create a Whitelist_CPF.
     */
    data: Prisma.XOR<Prisma.Whitelist_CPFCreateInput, Prisma.Whitelist_CPFUncheckedCreateInput>;
};
/**
 * Whitelist_CPF createMany
 */
export type Whitelist_CPFCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Whitelist_CPFS.
     */
    data: Prisma.Whitelist_CPFCreateManyInput | Prisma.Whitelist_CPFCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Whitelist_CPF update
 */
export type Whitelist_CPFUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * The data needed to update a Whitelist_CPF.
     */
    data: Prisma.XOR<Prisma.Whitelist_CPFUpdateInput, Prisma.Whitelist_CPFUncheckedUpdateInput>;
    /**
     * Choose, which Whitelist_CPF to update.
     */
    where: Prisma.Whitelist_CPFWhereUniqueInput;
};
/**
 * Whitelist_CPF updateMany
 */
export type Whitelist_CPFUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Whitelist_CPFS.
     */
    data: Prisma.XOR<Prisma.Whitelist_CPFUpdateManyMutationInput, Prisma.Whitelist_CPFUncheckedUpdateManyInput>;
    /**
     * Filter which Whitelist_CPFS to update
     */
    where?: Prisma.Whitelist_CPFWhereInput;
    /**
     * Limit how many Whitelist_CPFS to update.
     */
    limit?: number;
};
/**
 * Whitelist_CPF upsert
 */
export type Whitelist_CPFUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * The filter to search for the Whitelist_CPF to update in case it exists.
     */
    where: Prisma.Whitelist_CPFWhereUniqueInput;
    /**
     * In case the Whitelist_CPF found by the `where` argument doesn't exist, create a new Whitelist_CPF with this data.
     */
    create: Prisma.XOR<Prisma.Whitelist_CPFCreateInput, Prisma.Whitelist_CPFUncheckedCreateInput>;
    /**
     * In case the Whitelist_CPF was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.Whitelist_CPFUpdateInput, Prisma.Whitelist_CPFUncheckedUpdateInput>;
};
/**
 * Whitelist_CPF delete
 */
export type Whitelist_CPFDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
    /**
     * Filter which Whitelist_CPF to delete.
     */
    where: Prisma.Whitelist_CPFWhereUniqueInput;
};
/**
 * Whitelist_CPF deleteMany
 */
export type Whitelist_CPFDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Whitelist_CPFS to delete
     */
    where?: Prisma.Whitelist_CPFWhereInput;
    /**
     * Limit how many Whitelist_CPFS to delete.
     */
    limit?: number;
};
/**
 * Whitelist_CPF without action
 */
export type Whitelist_CPFDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Whitelist_CPF
     */
    select?: Prisma.Whitelist_CPFSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Whitelist_CPF
     */
    omit?: Prisma.Whitelist_CPFOmit<ExtArgs> | null;
};
//# sourceMappingURL=Whitelist_CPF.d.ts.map