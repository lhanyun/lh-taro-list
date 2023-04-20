// @ts-nocheck
export default class CacheUtils {

    cache = {}

    /**
     * 删除一个缓存.
     * @param key
     */
    delete(key) {
        delete this.cache[key]
    }

    /**
     * 清空所有缓存.
     */
    clear() {
        this.cache = {}
    }

    /**
     * 是否有缓存值.
     */
    isCached(key) {
        return !!this.cache[key]
    }

    updateCache(resource, key,) {
        return this.touch(resource, key);
    }

    setCache(key, res) {
        this.cache[key] = res
    }

    /**
    * 发起网络请求.
    */
    cacheable(
        resource,
        key,
        options = {},
    ) {
        const { isUpdate = false } = options
        let cacheValue = this.cache[key]

        if (isUpdate || !cacheValue) {
            return this.touch(resource, key);
        }

        return cacheValue
    }

    async touch(resource, key) {
        const res = await resource()
        this.cache[key] = res
        return res
    }
}