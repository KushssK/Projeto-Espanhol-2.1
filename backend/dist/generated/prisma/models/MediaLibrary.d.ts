import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model MediaLibrary
 *
 */
export type MediaLibraryModel = runtime.Types.Result.DefaultSelection<Prisma.$MediaLibraryPayload>;
export type AggregateMediaLibrary = {
    _count: MediaLibraryCountAggregateOutputType | null;
    _avg: MediaLibraryAvgAggregateOutputType | null;
    _sum: MediaLibrarySumAggregateOutputType | null;
    _min: MediaLibraryMinAggregateOutputType | null;
    _max: MediaLibraryMaxAggregateOutputType | null;
};
export type MediaLibraryAvgAggregateOutputType = {
    orderIndex: number | null;
};
export type MediaLibrarySumAggregateOutputType = {
    orderIndex: number | null;
};
export type MediaLibraryMinAggregateOutputType = {
    id: string | null;
    moduleId: string | null;
    title: string | null;
    description: string | null;
    type: $Enums.MediaType | null;
    url: string | null;
    videoUrl: string | null;
    orderIndex: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MediaLibraryMaxAggregateOutputType = {
    id: string | null;
    moduleId: string | null;
    title: string | null;
    description: string | null;
    type: $Enums.MediaType | null;
    url: string | null;
    videoUrl: string | null;
    orderIndex: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MediaLibraryCountAggregateOutputType = {
    id: number;
    moduleId: number;
    title: number;
    description: number;
    type: number;
    url: number;
    videoUrl: number;
    orderIndex: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type MediaLibraryAvgAggregateInputType = {
    orderIndex?: true;
};
export type MediaLibrarySumAggregateInputType = {
    orderIndex?: true;
};
export type MediaLibraryMinAggregateInputType = {
    id?: true;
    moduleId?: true;
    title?: true;
    description?: true;
    type?: true;
    url?: true;
    videoUrl?: true;
    orderIndex?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MediaLibraryMaxAggregateInputType = {
    id?: true;
    moduleId?: true;
    title?: true;
    description?: true;
    type?: true;
    url?: true;
    videoUrl?: true;
    orderIndex?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MediaLibraryCountAggregateInputType = {
    id?: true;
    moduleId?: true;
    title?: true;
    description?: true;
    type?: true;
    url?: true;
    videoUrl?: true;
    orderIndex?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type MediaLibraryAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which MediaLibrary to aggregate.
     */
    where?: Prisma.MediaLibraryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MediaLibraries to fetch.
     */
    orderBy?: Prisma.MediaLibraryOrderByWithRelationInput | Prisma.MediaLibraryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.MediaLibraryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MediaLibraries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MediaLibraries.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned MediaLibraries
    **/
    _count?: true | MediaLibraryCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: MediaLibraryAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: MediaLibrarySumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: MediaLibraryMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: MediaLibraryMaxAggregateInputType;
};
export type GetMediaLibraryAggregateType<T extends MediaLibraryAggregateArgs> = {
    [P in keyof T & keyof AggregateMediaLibrary]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMediaLibrary[P]> : Prisma.GetScalarType<T[P], AggregateMediaLibrary[P]>;
};
export type MediaLibraryGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MediaLibraryWhereInput;
    orderBy?: Prisma.MediaLibraryOrderByWithAggregationInput | Prisma.MediaLibraryOrderByWithAggregationInput[];
    by: Prisma.MediaLibraryScalarFieldEnum[] | Prisma.MediaLibraryScalarFieldEnum;
    having?: Prisma.MediaLibraryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MediaLibraryCountAggregateInputType | true;
    _avg?: MediaLibraryAvgAggregateInputType;
    _sum?: MediaLibrarySumAggregateInputType;
    _min?: MediaLibraryMinAggregateInputType;
    _max?: MediaLibraryMaxAggregateInputType;
};
export type MediaLibraryGroupByOutputType = {
    id: string;
    moduleId: string | null;
    title: string;
    description: string | null;
    type: $Enums.MediaType;
    url: string | null;
    videoUrl: string | null;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
    _count: MediaLibraryCountAggregateOutputType | null;
    _avg: MediaLibraryAvgAggregateOutputType | null;
    _sum: MediaLibrarySumAggregateOutputType | null;
    _min: MediaLibraryMinAggregateOutputType | null;
    _max: MediaLibraryMaxAggregateOutputType | null;
};
export type GetMediaLibraryGroupByPayload<T extends MediaLibraryGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MediaLibraryGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MediaLibraryGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MediaLibraryGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MediaLibraryGroupByOutputType[P]>;
}>>;
export type MediaLibraryWhereInput = {
    AND?: Prisma.MediaLibraryWhereInput | Prisma.MediaLibraryWhereInput[];
    OR?: Prisma.MediaLibraryWhereInput[];
    NOT?: Prisma.MediaLibraryWhereInput | Prisma.MediaLibraryWhereInput[];
    id?: Prisma.StringFilter<"MediaLibrary"> | string;
    moduleId?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    title?: Prisma.StringFilter<"MediaLibrary"> | string;
    description?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    type?: Prisma.EnumMediaTypeFilter<"MediaLibrary"> | $Enums.MediaType;
    url?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    videoUrl?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    orderIndex?: Prisma.IntFilter<"MediaLibrary"> | number;
    createdAt?: Prisma.DateTimeFilter<"MediaLibrary"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MediaLibrary"> | Date | string;
    module?: Prisma.XOR<Prisma.ModuleNullableScalarRelationFilter, Prisma.ModuleWhereInput> | null;
};
export type MediaLibraryOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    moduleId?: Prisma.SortOrderInput | Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    type?: Prisma.SortOrder;
    url?: Prisma.SortOrderInput | Prisma.SortOrder;
    videoUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    orderIndex?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    module?: Prisma.ModuleOrderByWithRelationInput;
    _relevance?: Prisma.MediaLibraryOrderByRelevanceInput;
};
export type MediaLibraryWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.MediaLibraryWhereInput | Prisma.MediaLibraryWhereInput[];
    OR?: Prisma.MediaLibraryWhereInput[];
    NOT?: Prisma.MediaLibraryWhereInput | Prisma.MediaLibraryWhereInput[];
    moduleId?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    title?: Prisma.StringFilter<"MediaLibrary"> | string;
    description?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    type?: Prisma.EnumMediaTypeFilter<"MediaLibrary"> | $Enums.MediaType;
    url?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    videoUrl?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    orderIndex?: Prisma.IntFilter<"MediaLibrary"> | number;
    createdAt?: Prisma.DateTimeFilter<"MediaLibrary"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MediaLibrary"> | Date | string;
    module?: Prisma.XOR<Prisma.ModuleNullableScalarRelationFilter, Prisma.ModuleWhereInput> | null;
}, "id">;
export type MediaLibraryOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    moduleId?: Prisma.SortOrderInput | Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    type?: Prisma.SortOrder;
    url?: Prisma.SortOrderInput | Prisma.SortOrder;
    videoUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    orderIndex?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.MediaLibraryCountOrderByAggregateInput;
    _avg?: Prisma.MediaLibraryAvgOrderByAggregateInput;
    _max?: Prisma.MediaLibraryMaxOrderByAggregateInput;
    _min?: Prisma.MediaLibraryMinOrderByAggregateInput;
    _sum?: Prisma.MediaLibrarySumOrderByAggregateInput;
};
export type MediaLibraryScalarWhereWithAggregatesInput = {
    AND?: Prisma.MediaLibraryScalarWhereWithAggregatesInput | Prisma.MediaLibraryScalarWhereWithAggregatesInput[];
    OR?: Prisma.MediaLibraryScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MediaLibraryScalarWhereWithAggregatesInput | Prisma.MediaLibraryScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"MediaLibrary"> | string;
    moduleId?: Prisma.StringNullableWithAggregatesFilter<"MediaLibrary"> | string | null;
    title?: Prisma.StringWithAggregatesFilter<"MediaLibrary"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"MediaLibrary"> | string | null;
    type?: Prisma.EnumMediaTypeWithAggregatesFilter<"MediaLibrary"> | $Enums.MediaType;
    url?: Prisma.StringNullableWithAggregatesFilter<"MediaLibrary"> | string | null;
    videoUrl?: Prisma.StringNullableWithAggregatesFilter<"MediaLibrary"> | string | null;
    orderIndex?: Prisma.IntWithAggregatesFilter<"MediaLibrary"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"MediaLibrary"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"MediaLibrary"> | Date | string;
};
export type MediaLibraryCreateInput = {
    id?: string;
    title: string;
    description?: string | null;
    type: $Enums.MediaType;
    url?: string | null;
    videoUrl?: string | null;
    orderIndex?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    module?: Prisma.ModuleCreateNestedOneWithoutMediaItemsInput;
};
export type MediaLibraryUncheckedCreateInput = {
    id?: string;
    moduleId?: string | null;
    title: string;
    description?: string | null;
    type: $Enums.MediaType;
    url?: string | null;
    videoUrl?: string | null;
    orderIndex?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaLibraryUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    type?: Prisma.EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType;
    url?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    videoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    orderIndex?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    module?: Prisma.ModuleUpdateOneWithoutMediaItemsNestedInput;
};
export type MediaLibraryUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    moduleId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    type?: Prisma.EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType;
    url?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    videoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    orderIndex?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaLibraryCreateManyInput = {
    id?: string;
    moduleId?: string | null;
    title: string;
    description?: string | null;
    type: $Enums.MediaType;
    url?: string | null;
    videoUrl?: string | null;
    orderIndex?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaLibraryUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    type?: Prisma.EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType;
    url?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    videoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    orderIndex?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaLibraryUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    moduleId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    type?: Prisma.EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType;
    url?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    videoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    orderIndex?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaLibraryListRelationFilter = {
    every?: Prisma.MediaLibraryWhereInput;
    some?: Prisma.MediaLibraryWhereInput;
    none?: Prisma.MediaLibraryWhereInput;
};
export type MediaLibraryOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type MediaLibraryOrderByRelevanceInput = {
    fields: Prisma.MediaLibraryOrderByRelevanceFieldEnum | Prisma.MediaLibraryOrderByRelevanceFieldEnum[];
    sort: Prisma.SortOrder;
    search: string;
};
export type MediaLibraryCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    moduleId?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    videoUrl?: Prisma.SortOrder;
    orderIndex?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MediaLibraryAvgOrderByAggregateInput = {
    orderIndex?: Prisma.SortOrder;
};
export type MediaLibraryMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    moduleId?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    videoUrl?: Prisma.SortOrder;
    orderIndex?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MediaLibraryMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    moduleId?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    videoUrl?: Prisma.SortOrder;
    orderIndex?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MediaLibrarySumOrderByAggregateInput = {
    orderIndex?: Prisma.SortOrder;
};
export type MediaLibraryCreateNestedManyWithoutModuleInput = {
    create?: Prisma.XOR<Prisma.MediaLibraryCreateWithoutModuleInput, Prisma.MediaLibraryUncheckedCreateWithoutModuleInput> | Prisma.MediaLibraryCreateWithoutModuleInput[] | Prisma.MediaLibraryUncheckedCreateWithoutModuleInput[];
    connectOrCreate?: Prisma.MediaLibraryCreateOrConnectWithoutModuleInput | Prisma.MediaLibraryCreateOrConnectWithoutModuleInput[];
    createMany?: Prisma.MediaLibraryCreateManyModuleInputEnvelope;
    connect?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
};
export type MediaLibraryUncheckedCreateNestedManyWithoutModuleInput = {
    create?: Prisma.XOR<Prisma.MediaLibraryCreateWithoutModuleInput, Prisma.MediaLibraryUncheckedCreateWithoutModuleInput> | Prisma.MediaLibraryCreateWithoutModuleInput[] | Prisma.MediaLibraryUncheckedCreateWithoutModuleInput[];
    connectOrCreate?: Prisma.MediaLibraryCreateOrConnectWithoutModuleInput | Prisma.MediaLibraryCreateOrConnectWithoutModuleInput[];
    createMany?: Prisma.MediaLibraryCreateManyModuleInputEnvelope;
    connect?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
};
export type MediaLibraryUpdateManyWithoutModuleNestedInput = {
    create?: Prisma.XOR<Prisma.MediaLibraryCreateWithoutModuleInput, Prisma.MediaLibraryUncheckedCreateWithoutModuleInput> | Prisma.MediaLibraryCreateWithoutModuleInput[] | Prisma.MediaLibraryUncheckedCreateWithoutModuleInput[];
    connectOrCreate?: Prisma.MediaLibraryCreateOrConnectWithoutModuleInput | Prisma.MediaLibraryCreateOrConnectWithoutModuleInput[];
    upsert?: Prisma.MediaLibraryUpsertWithWhereUniqueWithoutModuleInput | Prisma.MediaLibraryUpsertWithWhereUniqueWithoutModuleInput[];
    createMany?: Prisma.MediaLibraryCreateManyModuleInputEnvelope;
    set?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    disconnect?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    delete?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    connect?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    update?: Prisma.MediaLibraryUpdateWithWhereUniqueWithoutModuleInput | Prisma.MediaLibraryUpdateWithWhereUniqueWithoutModuleInput[];
    updateMany?: Prisma.MediaLibraryUpdateManyWithWhereWithoutModuleInput | Prisma.MediaLibraryUpdateManyWithWhereWithoutModuleInput[];
    deleteMany?: Prisma.MediaLibraryScalarWhereInput | Prisma.MediaLibraryScalarWhereInput[];
};
export type MediaLibraryUncheckedUpdateManyWithoutModuleNestedInput = {
    create?: Prisma.XOR<Prisma.MediaLibraryCreateWithoutModuleInput, Prisma.MediaLibraryUncheckedCreateWithoutModuleInput> | Prisma.MediaLibraryCreateWithoutModuleInput[] | Prisma.MediaLibraryUncheckedCreateWithoutModuleInput[];
    connectOrCreate?: Prisma.MediaLibraryCreateOrConnectWithoutModuleInput | Prisma.MediaLibraryCreateOrConnectWithoutModuleInput[];
    upsert?: Prisma.MediaLibraryUpsertWithWhereUniqueWithoutModuleInput | Prisma.MediaLibraryUpsertWithWhereUniqueWithoutModuleInput[];
    createMany?: Prisma.MediaLibraryCreateManyModuleInputEnvelope;
    set?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    disconnect?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    delete?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    connect?: Prisma.MediaLibraryWhereUniqueInput | Prisma.MediaLibraryWhereUniqueInput[];
    update?: Prisma.MediaLibraryUpdateWithWhereUniqueWithoutModuleInput | Prisma.MediaLibraryUpdateWithWhereUniqueWithoutModuleInput[];
    updateMany?: Prisma.MediaLibraryUpdateManyWithWhereWithoutModuleInput | Prisma.MediaLibraryUpdateManyWithWhereWithoutModuleInput[];
    deleteMany?: Prisma.MediaLibraryScalarWhereInput | Prisma.MediaLibraryScalarWhereInput[];
};
export type EnumMediaTypeFieldUpdateOperationsInput = {
    set?: $Enums.MediaType;
};
export type MediaLibraryCreateWithoutModuleInput = {
    id?: string;
    title: string;
    description?: string | null;
    type: $Enums.MediaType;
    url?: string | null;
    videoUrl?: string | null;
    orderIndex?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaLibraryUncheckedCreateWithoutModuleInput = {
    id?: string;
    title: string;
    description?: string | null;
    type: $Enums.MediaType;
    url?: string | null;
    videoUrl?: string | null;
    orderIndex?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaLibraryCreateOrConnectWithoutModuleInput = {
    where: Prisma.MediaLibraryWhereUniqueInput;
    create: Prisma.XOR<Prisma.MediaLibraryCreateWithoutModuleInput, Prisma.MediaLibraryUncheckedCreateWithoutModuleInput>;
};
export type MediaLibraryCreateManyModuleInputEnvelope = {
    data: Prisma.MediaLibraryCreateManyModuleInput | Prisma.MediaLibraryCreateManyModuleInput[];
    skipDuplicates?: boolean;
};
export type MediaLibraryUpsertWithWhereUniqueWithoutModuleInput = {
    where: Prisma.MediaLibraryWhereUniqueInput;
    update: Prisma.XOR<Prisma.MediaLibraryUpdateWithoutModuleInput, Prisma.MediaLibraryUncheckedUpdateWithoutModuleInput>;
    create: Prisma.XOR<Prisma.MediaLibraryCreateWithoutModuleInput, Prisma.MediaLibraryUncheckedCreateWithoutModuleInput>;
};
export type MediaLibraryUpdateWithWhereUniqueWithoutModuleInput = {
    where: Prisma.MediaLibraryWhereUniqueInput;
    data: Prisma.XOR<Prisma.MediaLibraryUpdateWithoutModuleInput, Prisma.MediaLibraryUncheckedUpdateWithoutModuleInput>;
};
export type MediaLibraryUpdateManyWithWhereWithoutModuleInput = {
    where: Prisma.MediaLibraryScalarWhereInput;
    data: Prisma.XOR<Prisma.MediaLibraryUpdateManyMutationInput, Prisma.MediaLibraryUncheckedUpdateManyWithoutModuleInput>;
};
export type MediaLibraryScalarWhereInput = {
    AND?: Prisma.MediaLibraryScalarWhereInput | Prisma.MediaLibraryScalarWhereInput[];
    OR?: Prisma.MediaLibraryScalarWhereInput[];
    NOT?: Prisma.MediaLibraryScalarWhereInput | Prisma.MediaLibraryScalarWhereInput[];
    id?: Prisma.StringFilter<"MediaLibrary"> | string;
    moduleId?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    title?: Prisma.StringFilter<"MediaLibrary"> | string;
    description?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    type?: Prisma.EnumMediaTypeFilter<"MediaLibrary"> | $Enums.MediaType;
    url?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    videoUrl?: Prisma.StringNullableFilter<"MediaLibrary"> | string | null;
    orderIndex?: Prisma.IntFilter<"MediaLibrary"> | number;
    createdAt?: Prisma.DateTimeFilter<"MediaLibrary"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"MediaLibrary"> | Date | string;
};
export type MediaLibraryCreateManyModuleInput = {
    id?: string;
    title: string;
    description?: string | null;
    type: $Enums.MediaType;
    url?: string | null;
    videoUrl?: string | null;
    orderIndex?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaLibraryUpdateWithoutModuleInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    type?: Prisma.EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType;
    url?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    videoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    orderIndex?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaLibraryUncheckedUpdateWithoutModuleInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    type?: Prisma.EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType;
    url?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    videoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    orderIndex?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaLibraryUncheckedUpdateManyWithoutModuleInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    type?: Prisma.EnumMediaTypeFieldUpdateOperationsInput | $Enums.MediaType;
    url?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    videoUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    orderIndex?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaLibrarySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    moduleId?: boolean;
    title?: boolean;
    description?: boolean;
    type?: boolean;
    url?: boolean;
    videoUrl?: boolean;
    orderIndex?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    module?: boolean | Prisma.MediaLibrary$moduleArgs<ExtArgs>;
}, ExtArgs["result"]["mediaLibrary"]>;
export type MediaLibrarySelectScalar = {
    id?: boolean;
    moduleId?: boolean;
    title?: boolean;
    description?: boolean;
    type?: boolean;
    url?: boolean;
    videoUrl?: boolean;
    orderIndex?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type MediaLibraryOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "moduleId" | "title" | "description" | "type" | "url" | "videoUrl" | "orderIndex" | "createdAt" | "updatedAt", ExtArgs["result"]["mediaLibrary"]>;
export type MediaLibraryInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    module?: boolean | Prisma.MediaLibrary$moduleArgs<ExtArgs>;
};
export type $MediaLibraryPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "MediaLibrary";
    objects: {
        module: Prisma.$ModulePayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        moduleId: string | null;
        title: string;
        description: string | null;
        type: $Enums.MediaType;
        url: string | null;
        videoUrl: string | null;
        orderIndex: number;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["mediaLibrary"]>;
    composites: {};
};
export type MediaLibraryGetPayload<S extends boolean | null | undefined | MediaLibraryDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload, S>;
export type MediaLibraryCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MediaLibraryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MediaLibraryCountAggregateInputType | true;
};
export interface MediaLibraryDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['MediaLibrary'];
        meta: {
            name: 'MediaLibrary';
        };
    };
    /**
     * Find zero or one MediaLibrary that matches the filter.
     * @param {MediaLibraryFindUniqueArgs} args - Arguments to find a MediaLibrary
     * @example
     * // Get one MediaLibrary
     * const mediaLibrary = await prisma.mediaLibrary.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MediaLibraryFindUniqueArgs>(args: Prisma.SelectSubset<T, MediaLibraryFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one MediaLibrary that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MediaLibraryFindUniqueOrThrowArgs} args - Arguments to find a MediaLibrary
     * @example
     * // Get one MediaLibrary
     * const mediaLibrary = await prisma.mediaLibrary.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MediaLibraryFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MediaLibraryFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first MediaLibrary that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaLibraryFindFirstArgs} args - Arguments to find a MediaLibrary
     * @example
     * // Get one MediaLibrary
     * const mediaLibrary = await prisma.mediaLibrary.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MediaLibraryFindFirstArgs>(args?: Prisma.SelectSubset<T, MediaLibraryFindFirstArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first MediaLibrary that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaLibraryFindFirstOrThrowArgs} args - Arguments to find a MediaLibrary
     * @example
     * // Get one MediaLibrary
     * const mediaLibrary = await prisma.mediaLibrary.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MediaLibraryFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MediaLibraryFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more MediaLibraries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaLibraryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MediaLibraries
     * const mediaLibraries = await prisma.mediaLibrary.findMany()
     *
     * // Get first 10 MediaLibraries
     * const mediaLibraries = await prisma.mediaLibrary.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const mediaLibraryWithIdOnly = await prisma.mediaLibrary.findMany({ select: { id: true } })
     *
     */
    findMany<T extends MediaLibraryFindManyArgs>(args?: Prisma.SelectSubset<T, MediaLibraryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a MediaLibrary.
     * @param {MediaLibraryCreateArgs} args - Arguments to create a MediaLibrary.
     * @example
     * // Create one MediaLibrary
     * const MediaLibrary = await prisma.mediaLibrary.create({
     *   data: {
     *     // ... data to create a MediaLibrary
     *   }
     * })
     *
     */
    create<T extends MediaLibraryCreateArgs>(args: Prisma.SelectSubset<T, MediaLibraryCreateArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many MediaLibraries.
     * @param {MediaLibraryCreateManyArgs} args - Arguments to create many MediaLibraries.
     * @example
     * // Create many MediaLibraries
     * const mediaLibrary = await prisma.mediaLibrary.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends MediaLibraryCreateManyArgs>(args?: Prisma.SelectSubset<T, MediaLibraryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Delete a MediaLibrary.
     * @param {MediaLibraryDeleteArgs} args - Arguments to delete one MediaLibrary.
     * @example
     * // Delete one MediaLibrary
     * const MediaLibrary = await prisma.mediaLibrary.delete({
     *   where: {
     *     // ... filter to delete one MediaLibrary
     *   }
     * })
     *
     */
    delete<T extends MediaLibraryDeleteArgs>(args: Prisma.SelectSubset<T, MediaLibraryDeleteArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one MediaLibrary.
     * @param {MediaLibraryUpdateArgs} args - Arguments to update one MediaLibrary.
     * @example
     * // Update one MediaLibrary
     * const mediaLibrary = await prisma.mediaLibrary.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends MediaLibraryUpdateArgs>(args: Prisma.SelectSubset<T, MediaLibraryUpdateArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more MediaLibraries.
     * @param {MediaLibraryDeleteManyArgs} args - Arguments to filter MediaLibraries to delete.
     * @example
     * // Delete a few MediaLibraries
     * const { count } = await prisma.mediaLibrary.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends MediaLibraryDeleteManyArgs>(args?: Prisma.SelectSubset<T, MediaLibraryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more MediaLibraries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaLibraryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MediaLibraries
     * const mediaLibrary = await prisma.mediaLibrary.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends MediaLibraryUpdateManyArgs>(args: Prisma.SelectSubset<T, MediaLibraryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create or update one MediaLibrary.
     * @param {MediaLibraryUpsertArgs} args - Arguments to update or create a MediaLibrary.
     * @example
     * // Update or create a MediaLibrary
     * const mediaLibrary = await prisma.mediaLibrary.upsert({
     *   create: {
     *     // ... data to create a MediaLibrary
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MediaLibrary we want to update
     *   }
     * })
     */
    upsert<T extends MediaLibraryUpsertArgs>(args: Prisma.SelectSubset<T, MediaLibraryUpsertArgs<ExtArgs>>): Prisma.Prisma__MediaLibraryClient<runtime.Types.Result.GetResult<Prisma.$MediaLibraryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of MediaLibraries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaLibraryCountArgs} args - Arguments to filter MediaLibraries to count.
     * @example
     * // Count the number of MediaLibraries
     * const count = await prisma.mediaLibrary.count({
     *   where: {
     *     // ... the filter for the MediaLibraries we want to count
     *   }
     * })
    **/
    count<T extends MediaLibraryCountArgs>(args?: Prisma.Subset<T, MediaLibraryCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MediaLibraryCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a MediaLibrary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaLibraryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends MediaLibraryAggregateArgs>(args: Prisma.Subset<T, MediaLibraryAggregateArgs>): Prisma.PrismaPromise<GetMediaLibraryAggregateType<T>>;
    /**
     * Group by MediaLibrary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaLibraryGroupByArgs} args - Group by arguments.
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
    groupBy<T extends MediaLibraryGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MediaLibraryGroupByArgs['orderBy'];
    } : {
        orderBy?: MediaLibraryGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MediaLibraryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMediaLibraryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the MediaLibrary model
     */
    readonly fields: MediaLibraryFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for MediaLibrary.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__MediaLibraryClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    module<T extends Prisma.MediaLibrary$moduleArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.MediaLibrary$moduleArgs<ExtArgs>>): Prisma.Prisma__ModuleClient<runtime.Types.Result.GetResult<Prisma.$ModulePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the MediaLibrary model
 */
export interface MediaLibraryFieldRefs {
    readonly id: Prisma.FieldRef<"MediaLibrary", 'String'>;
    readonly moduleId: Prisma.FieldRef<"MediaLibrary", 'String'>;
    readonly title: Prisma.FieldRef<"MediaLibrary", 'String'>;
    readonly description: Prisma.FieldRef<"MediaLibrary", 'String'>;
    readonly type: Prisma.FieldRef<"MediaLibrary", 'MediaType'>;
    readonly url: Prisma.FieldRef<"MediaLibrary", 'String'>;
    readonly videoUrl: Prisma.FieldRef<"MediaLibrary", 'String'>;
    readonly orderIndex: Prisma.FieldRef<"MediaLibrary", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"MediaLibrary", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"MediaLibrary", 'DateTime'>;
}
/**
 * MediaLibrary findUnique
 */
export type MediaLibraryFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * Filter, which MediaLibrary to fetch.
     */
    where: Prisma.MediaLibraryWhereUniqueInput;
};
/**
 * MediaLibrary findUniqueOrThrow
 */
export type MediaLibraryFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * Filter, which MediaLibrary to fetch.
     */
    where: Prisma.MediaLibraryWhereUniqueInput;
};
/**
 * MediaLibrary findFirst
 */
export type MediaLibraryFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * Filter, which MediaLibrary to fetch.
     */
    where?: Prisma.MediaLibraryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MediaLibraries to fetch.
     */
    orderBy?: Prisma.MediaLibraryOrderByWithRelationInput | Prisma.MediaLibraryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for MediaLibraries.
     */
    cursor?: Prisma.MediaLibraryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MediaLibraries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MediaLibraries.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of MediaLibraries.
     */
    distinct?: Prisma.MediaLibraryScalarFieldEnum | Prisma.MediaLibraryScalarFieldEnum[];
};
/**
 * MediaLibrary findFirstOrThrow
 */
export type MediaLibraryFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * Filter, which MediaLibrary to fetch.
     */
    where?: Prisma.MediaLibraryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MediaLibraries to fetch.
     */
    orderBy?: Prisma.MediaLibraryOrderByWithRelationInput | Prisma.MediaLibraryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for MediaLibraries.
     */
    cursor?: Prisma.MediaLibraryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MediaLibraries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MediaLibraries.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of MediaLibraries.
     */
    distinct?: Prisma.MediaLibraryScalarFieldEnum | Prisma.MediaLibraryScalarFieldEnum[];
};
/**
 * MediaLibrary findMany
 */
export type MediaLibraryFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * Filter, which MediaLibraries to fetch.
     */
    where?: Prisma.MediaLibraryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MediaLibraries to fetch.
     */
    orderBy?: Prisma.MediaLibraryOrderByWithRelationInput | Prisma.MediaLibraryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing MediaLibraries.
     */
    cursor?: Prisma.MediaLibraryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MediaLibraries from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MediaLibraries.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of MediaLibraries.
     */
    distinct?: Prisma.MediaLibraryScalarFieldEnum | Prisma.MediaLibraryScalarFieldEnum[];
};
/**
 * MediaLibrary create
 */
export type MediaLibraryCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * The data needed to create a MediaLibrary.
     */
    data: Prisma.XOR<Prisma.MediaLibraryCreateInput, Prisma.MediaLibraryUncheckedCreateInput>;
};
/**
 * MediaLibrary createMany
 */
export type MediaLibraryCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many MediaLibraries.
     */
    data: Prisma.MediaLibraryCreateManyInput | Prisma.MediaLibraryCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * MediaLibrary update
 */
export type MediaLibraryUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * The data needed to update a MediaLibrary.
     */
    data: Prisma.XOR<Prisma.MediaLibraryUpdateInput, Prisma.MediaLibraryUncheckedUpdateInput>;
    /**
     * Choose, which MediaLibrary to update.
     */
    where: Prisma.MediaLibraryWhereUniqueInput;
};
/**
 * MediaLibrary updateMany
 */
export type MediaLibraryUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update MediaLibraries.
     */
    data: Prisma.XOR<Prisma.MediaLibraryUpdateManyMutationInput, Prisma.MediaLibraryUncheckedUpdateManyInput>;
    /**
     * Filter which MediaLibraries to update
     */
    where?: Prisma.MediaLibraryWhereInput;
    /**
     * Limit how many MediaLibraries to update.
     */
    limit?: number;
};
/**
 * MediaLibrary upsert
 */
export type MediaLibraryUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * The filter to search for the MediaLibrary to update in case it exists.
     */
    where: Prisma.MediaLibraryWhereUniqueInput;
    /**
     * In case the MediaLibrary found by the `where` argument doesn't exist, create a new MediaLibrary with this data.
     */
    create: Prisma.XOR<Prisma.MediaLibraryCreateInput, Prisma.MediaLibraryUncheckedCreateInput>;
    /**
     * In case the MediaLibrary was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.MediaLibraryUpdateInput, Prisma.MediaLibraryUncheckedUpdateInput>;
};
/**
 * MediaLibrary delete
 */
export type MediaLibraryDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
    /**
     * Filter which MediaLibrary to delete.
     */
    where: Prisma.MediaLibraryWhereUniqueInput;
};
/**
 * MediaLibrary deleteMany
 */
export type MediaLibraryDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which MediaLibraries to delete
     */
    where?: Prisma.MediaLibraryWhereInput;
    /**
     * Limit how many MediaLibraries to delete.
     */
    limit?: number;
};
/**
 * MediaLibrary.module
 */
export type MediaLibrary$moduleArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Module
     */
    select?: Prisma.ModuleSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Module
     */
    omit?: Prisma.ModuleOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ModuleInclude<ExtArgs> | null;
    where?: Prisma.ModuleWhereInput;
};
/**
 * MediaLibrary without action
 */
export type MediaLibraryDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaLibrary
     */
    select?: Prisma.MediaLibrarySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MediaLibrary
     */
    omit?: Prisma.MediaLibraryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MediaLibraryInclude<ExtArgs> | null;
};
//# sourceMappingURL=MediaLibrary.d.ts.map