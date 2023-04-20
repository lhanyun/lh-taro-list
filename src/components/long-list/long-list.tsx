// @ts-nocheck
import React, { Component } from 'react'
import Taro, { createSelectorQuery, getSystemInfoSync } from '@tarojs/taro'
import { View, ScrollView, Block } from '@tarojs/components'
import { throttle, isH5, getElementRect } from './common/utils'
import CacheUtils from './common/cache'

export default class VirtualList extends Component {
  static defaultProps = {
    list: [],
    pageNum: 1,
    listId: "smb-virtial-list",
    listType: 'single',
    segmentNum: 10,
    screenNum: 2,
    scrollViewProps: {},
    className: "",
    autoScrollTop: true,
    isSkeleton: false,
    onRender: function render() {
      return (<View />)
    },
  }
  constructor(props) {
    super(props)
    this.state = {
      wholePageIndex: 0, // 每一屏为一个单位，屏幕索引
      twoList: [], // 二维数组
      isComplete: false, // 数据是否全部加载完成
      innerScrollTop: 0, // 记录组件内部的滚动高度
      displays: {}, // 记录当前分组显示/隐藏状态
    }

    this.initList = [] // 承载初始化的二维数组
    this.windowHeight = 0 // 当前屏幕的高度
    this.currentPage = Taro.getCurrentInstance()
    this.cacheUtils = new CacheUtils() // 用来装每一屏的高度
    this.observers = [] // 监听对象数组
  }

  componentDidMount() {
    const { list, listType } = this.props
    this.getSystemInformation()
    if (listType === "single") {
      this.formatList(list)
    } else if (listType === "multi") {
      this.formatMultiList(list)
    }
  }

  componentWillUnmount() {
    this.resetState()
  }

  initReceiveProps(nextProps) {
    const { list, listType } = this.props
    if (listType === "single") {
      // 提前把innerScrollTop置为不是0，防止列表置顶失效
      this.setState({
        innerScrollTop: 1,
      })

      this.cacheUtils = new CacheUtils()
      this.resetState(() => {
        if (nextProps.list?.length) {
          this.formatList(nextProps.list)
        } else {
          this.handleComplete()
        }
      })
    } else if (listType === "multi") {
      this.formatMultiList(nextProps.list, nextProps.pageNum)
    }
    if (!nextProps.list?.length) {
      // list为空
      this.handleComplete()
    }
  }

  // 重置状态
  resetState = (callback = () => {}) => {
    // 释放监听对象
    this.observers.forEach(observer => {
      observer?.disconnect()
    })

    this.setState({
      wholePageIndex: 0,
      isComplete: false,
      twoList: [],
      innerScrollTop: 0,
      displays: {}
    }, callback)
  }
  
  getSystemInformation = () => {
    try {
      const res = getSystemInfoSync()
      this.windowHeight = res.windowHeight
    } catch (err) {
      console.error(`获取系统信息失败：${err}`)
    }
  }
  /**
   * 列表数据渲染完成
   */
  handleComplete = () => {
    const { onComplete } = this.props
    this.setState({
      isComplete: true,
    }, () => {
      onComplete?.()
    })
  }
  /**
   * 当list是通过服务端分页获取的时候，对list进行处理
   * @param	list 外部list
   * @param	pageNum 当前页码
   */
  formatMultiList(list = [], pageNum = 1) {
    const { twoList} = this.state
    if (!list?.length) return
    this.segmentList(list)
    twoList[pageNum - 1] = this.initList[pageNum - 1]
    this.setState({
      twoList: [...twoList],
      wholePageIndex: pageNum - 1,
    }, () => {
      Taro.nextTick(() => {
        this.setHeight(list)
      })
    })
  }
  /**
   * 按规则分割list，存在私有变量initList，备用
   */
  segmentList(list = []) {
    const { segmentNum } = this.props
    let arr = []
    const _list = []
    list.forEach((item, index) => {
      arr.push(item)
      if ((index + 1) % segmentNum === 0) {
        _list.push(arr)
        arr = []
      }
    })
    // 将分段不足segmentNum的剩余数据装入_list
    const restList = list.slice(_list.length * segmentNum)
    if (restList?.length) {
      _list.push(restList)
      if (_list.length <= 1) {
        // 如果数据量少，不足一个segmentNum，则触发完成回调
        this.handleComplete()
      }
    }
    this.initList = _list
  }
  /**
   * 将列表格式化为二维
   * @param	list 	列表
   */
  formatList(list = []) {
    this.segmentList(list)
    this.setState({
      twoList: this.initList.slice(0, 1),
    }, () => {
      Taro.nextTick(() => {
        this.setHeight(list)
      })
    })
  }
  renderNext = () => {
    const { onBottom, listType, scrollViewProps, list } = this.props
    if (listType === "single") {
      const page_index = this.state.wholePageIndex + 1
      if (!this.initList[page_index]?.length) {
        this.handleComplete()

        return
      }
      onBottom?.()

      this.setState({
        wholePageIndex: page_index,
      }, () => {
        const { wholePageIndex, twoList } = this.state
        twoList[wholePageIndex] = this.initList[wholePageIndex]
        this.setState({
          twoList: [...twoList],
        }, () => {
          Taro.nextTick(() => {
            this.setHeight(list)
          })
        })
      })
    } else if (listType === "multi") {
      scrollViewProps?.onScrollToLower?.()
    }
  }
  /**
   * 设置每一个维度的数据渲染完成之后所占的高度
   */
  setHeight(list = []) {
    const { wholePageIndex, twoList } = this.state
    const { listId, isSkeleton } = this.props
    // 获取每个子项的高度，方便做骨架图
    if (isSkeleton) {
      const element = twoList[wholePageIndex];
      for (let index = 0; index < element.length; index++) {
        this.cacheUtils.cacheable(()=>getElementRect(`#${listId} .wrap_${wholePageIndex} #wrap_${wholePageIndex}_${index}`), `${wholePageIndex}_${index}`)
      }
    } else {
      this.cacheUtils.cacheable(()=>getElementRect(`#${listId} .wrap_${wholePageIndex}`), `${wholePageIndex}`)
    }
 
    this.miniObserve()
  }

  /**
   * 小程序平台监听
   */
  miniObserve = () => {
    const { wholePageIndex } = this.state
    const { scrollViewProps, listId, screenNum, isSkeleton } = this.props
    // 以传入的scrollView的高度为相交区域的参考边界，若没传，则默认使用屏幕高度
    const scrollHeight = scrollViewProps?.style?.height || this.windowHeight
    const observer = Taro.createIntersectionObserver(this.currentPage.page).relativeToViewport({
      top: screenNum * scrollHeight,
      bottom: screenNum * scrollHeight,
    })
    observer.observe(`#${listId} .wrap_${wholePageIndex}`, (res) => {
      if (isSkeleton) {
        this.handleObserveSkeletonResult(res?.intersectionRatio <= 0, wholePageIndex)
      } else {
        this.handleObserveNormalResult(res?.intersectionRatio <= 0, wholePageIndex)
      }
    })

    this.observers.push(observer)
  }

  // 处理自定义骨架视图逻辑
  handleObserveSkeletonResult = (isHidden = false, index) => {
    const { displays } = this.state

    displays[`${index}`] = !isHidden

    this.setState({
      displays: { ...displays }
    })
  }

  // 处理容器高度逻辑
  handleObserveNormalResult = (isHidden = false, index) => {
    const { twoList } = this.state
    if (isHidden) {
      // 当没有与当前视口有相交区域，则将改屏的数据置为该屏的高度占位
      twoList[index] = { height: this.cacheUtils.cache[`${index}`] }
      this.setState({
        twoList: [...twoList],
      })
    } else if (!twoList[index]?.length) {
      // 如果有相交区域，则将对应的维度进行赋值
      twoList[index] = this.initList[index]
      this.setState({
        twoList: [...twoList],
      })
    }
  }

  // 更新高度
  updateHeight = ({pageIndex, index}) => {
    const { isSkeleton, listId } = this.props

    if (isSkeleton) {
      this.cacheUtils.updateCache(()=>getElementRect(`#${listId} .wrap_${pageIndex} #wrap_${pageIndex}_${index}`), `${pageIndex}_${index}`)
    } else {
      this.cacheUtils.updateCache(()=>getElementRect(`#${listId} .wrap_${pageIndex}`), `${pageIndex}`)
    }
  }

  handleScroll = throttle((event) => {
    const { listId } = this.props
    this.props.onGetScrollData?.({
      [`${listId}`]: event,
    })
    this.props.scrollViewProps?.onScroll?.(event)
  }, 300, 300)

  renderNormalList = () => {
    const { twoList } = this.state
    const {
      segmentNum,
      onRender,
    } = this.props

    return twoList?.map((item, pageIndex) => {
      return (
        <View key={pageIndex} data-index={pageIndex} className={`smb-wrap-item wrap_${pageIndex}`}>
          {
            item?.length > 0 ? (
              <Block>
                {
                  item.map((el, index) => {
                    return onRender?.({data: el, index: (pageIndex * segmentNum + index), pageIndex, id: `wrap_${pageIndex}_${index}`})
                  })
                }
              </Block>
            ) : (
              <View style={{'height': `${item?.height}px`}}></View>
            )
          }
        </View>
      )
    })
  }

  renderSkeletonList = () => {
    const { twoList, displays } = this.state
    const {
      segmentNum,
      onRender,
    } = this.props
    return twoList?.map((item, pageIndex) => {
      return (
        <View key={pageIndex} data-index={pageIndex} className={`smb-wrap-item wrap_${pageIndex}`}>
          {
            item.map((el, index) => {
              return onRender?.({
                data: el, 
                index: (pageIndex * segmentNum + index), pageIndex, 
                id: `wrap_${pageIndex}_${index}`, 
                isDisplay: displays[`${pageIndex}`] === undefined ? true : displays[`${pageIndex}`],
                height: this.cacheUtils.cache[`${pageIndex}_${index}`]
              })
            })
          }
        </View>
      )
    })
  }

  render() {
    const {
      twoList,
      isComplete,
      innerScrollTop,
    } = this.state
    const {
      segmentNum,
      scrollViewProps,
      onRenderTop,
      onRenderBottom,
      onRender,
      onRenderLoad,
      listId,
      className,
      autoScrollTop,
      isSkeleton,
    } = this.props

    const scrollStyle = {
      height: '100%',
    }

    const _scrollViewProps = {
      ...scrollViewProps,
      scrollTop: autoScrollTop ? (innerScrollTop === 0 ? 0 : "") : scrollViewProps?.scrollTop,
    }

    return (
      <ScrollView
        scrollY
        id={listId}
        style={scrollStyle}
        onScrollToLower={this.renderNext}
        lowerThreshold={250}
        className={`smb-virtual-list-container ${className}`}
        {..._scrollViewProps}
        onScroll={this.handleScroll}
      >
        {onRenderTop?.()}
        <View className="smb-main-list">
          {
            isSkeleton ? this.renderSkeletonList() : this.renderNormalList()
          }
        </View>
        {
          onRenderLoad?.() && (
            <View className="smb-loading-text">
              {onRenderLoad()}
            </View>
          )
        }
        {isComplete && onRenderBottom?.()}
      </ScrollView>
    )
  }
}
