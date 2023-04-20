// @ts-nocheck
import Taro from '@tarojs/taro'
/**
 * 是否是 H5 环境
 * @type {boolean}
 */
export const isH5 = Taro.ENV_TYPE.WEB === Taro.getEnv()

/**
* 截流函数
*
* @param {Function} fn 回调函数
* @param {number} delay 延迟毫秒数
* @param {number} mustRunDelay 延迟多少毫秒，强制执行一下
* @returns {Function} 截流函数
*/
// eslint-disable-next-line no-unused-vars
export const throttle = (fn, delay, mustRunDelay) => {
  let timer
  let startTime
  return (...args) => {
    const curTime = Date.now()
    clearTimeout(timer)
    if (!startTime) {
      startTime = curTime
    }
    if (curTime - startTime >= mustRunDelay) {
      fn.apply(this, args)
      startTime = curTime
    } else {
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay)
    }
  }
}

export const getElementRect = async (eleId = '', delay = 200) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      clearTimeout(t);

      Taro.createSelectorQuery()
        .select(eleId)
        .boundingClientRect((rect) => {
          if (rect) {
            resolve(rect?.height);
          } else {
            reject('获取不到元素');
          }
        })
        .exec();
    }, delay);
  });