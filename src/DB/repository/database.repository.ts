import { CreateOptions, DeleteResult, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, Types, UpdateQuery, UpdateWriteOpResult, FlattenMaps } from "mongoose";


export type lean<T> = FlattenMaps<T>

export abstract class DatabaseRepository<TDocument> {
    constructor(protected model: Model<TDocument>) { }

    async findById({
        id, option, select
    }: {
        id: Types.ObjectId;
        select?: ProjectionType<TDocument> | null;
        option?: QueryOptions<TDocument> | null;
    }): Promise<TDocument | null | lean<TDocument>> {
        const doc = this.model.findById(id).select(select || "");
        if (option?.populate) {
            doc.populate(option.populate as PopulateOptions[])
        }
        if (option?.lean) {
            doc.lean(option.lean);
        }
        return await doc.exec();
    }
    async findOne({ filter, select, options }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | null,
        options?: QueryOptions<TDocument>
    }): Promise<lean<TDocument> | TDocument | null> {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.lean) {
            doc.lean(options.lean)
        }

        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[])
        }
        return doc.exec();
    }

    async find({ filter,
        options,
        select
    }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | undefined,
        options?: QueryOptions<TDocument> | undefined
    }): Promise<TDocument[] | [] | lean<TDocument>[]> {
        const doc = this.model.find(filter || {}).select(select || '');
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.skip) {
            doc.skip(options.skip)
        }
        if (options?.limit) {
            doc.limit(options.limit);
        }
        if (options?.lean) {
            doc.lean(options.lean)
        }
        return await doc.exec();
    }

    async paginate({
        filter = {},
        options = {},
        select,
        page = 'all',
        size = 5
    }: {
        filter: RootFilterQuery<TDocument>;
        select?: ProjectionType<TDocument> | undefined;
        options?: QueryOptions<TDocument> | undefined;
        page?: number | 'all';
        size: number;
    }): Promise<{
        docsCount?: number;
        limit?: number;
        pages?: number;
        currentPage?: number | string;
        result: TDocument[] | lean<TDocument>[];
    }> {
        let docsCount: number | undefined = undefined;
        let pages: number | undefined = undefined;
        if (page !== 'all') {
            page = Math.floor(!page || page < 1 ? 1 : page);
            options.limit = Math.floor(size < 1 || !size ? 5 : size);
            options.skip = (page - 1) * options.limit;

            docsCount = await this.model.countDocuments(filter);
            pages = Math.ceil(docsCount / options.limit);
        }
        const result = await this.find({ filter, select, options });
        return {
            docsCount, limit: options.limit, pages, currentPage: page !== 'all' ? page : undefined, result
        }

    }

    async create({ data, option }: {
        data: Partial<TDocument>[],
        option?: CreateOptions | undefined
    }): Promise<TDocument[]> {
        return await this.model.create(data, option) || [];
    }
    async insertMany({ data }: { data: Partial<TDocument>[] }): Promise<TDocument[]> {
        return (await this.model.insertMany(data)) as TDocument[];
    }


    async updateOne({ filter, update, options }: {
        filter: RootFilterQuery<TDocument>,
        update: UpdateQuery<TDocument>,
        options?: MongooseUpdateQueryOptions<TDocument> | null
    }): Promise<UpdateWriteOpResult> {
        if (Array.isArray(update)) {
            update.push({
                $inc: { __v: 1 },
            });
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] }
                }
            })
        }
        return await this.model.updateOne(filter || {}, update, options)
    }

    async findOneAndUpdate({
        filter,
        update,
        options = { new: true },
    }: {
        filter?: RootFilterQuery<TDocument>;
        update: UpdateQuery<TDocument>;
        options?: QueryOptions<TDocument> | null;
    }): Promise<TDocument | lean<TDocument> | null> {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] }
                }
            })
            return await this.model.findOneAndUpdate(filter || {}, update, options)
        }
        return await this.model.findOneAndUpdate(filter || {}, { ...update, $inc: { __v: 1 } }, options)
    }

    async findOneAndDelete({
        filter,
    }: {
        filter?: RootFilterQuery<TDocument>;
    }): Promise<TDocument | lean<TDocument> | null> {
        return await this.model.findOneAndDelete(filter || {})
    }
    async findByIdAndUpdate({
        id, update, options = { new: true }
    }: {
        id: Types.ObjectId;
        update: UpdateQuery<TDocument>;
        options?: QueryOptions<TDocument> | null;
    }): Promise<TDocument | lean<TDocument> | null> {
        return await this.model.findByIdAndUpdate(id, { ...update, $inc: { __v: 1 } }, options)
    }

    async deleteOne({ filter }: {
        filter: RootFilterQuery<TDocument>
    }): Promise<DeleteResult> {
        return await this.model.deleteOne(filter || {});
    }
    async deleteMany({ filter }: {
        filter: RootFilterQuery<TDocument>
    }): Promise<DeleteResult> {
        return await this.model.deleteMany(filter || {});
    }
}