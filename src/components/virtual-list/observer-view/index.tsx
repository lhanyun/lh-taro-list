// @ts-nocheck
import { View } from "@tarojs/components";
import React, { createElement, useEffect, useRef } from "react";
import Taro from '@tarojs/taro';
import '../../../style/components/observer-view/index.scss';

const Index = ({position = {top: 0, bottom: 0}, resetScroll, list = [], SkeletonView}) => {
    const observerObjs = useRef([])

    useEffect(() => {
        disableObserver()

        const timeOutId = setTimeout(() => {
            observePage()
            clearTimeout(timeOutId)
        }, 0)

        return () => {
            clearTimeout(timeOutId)
            disableObserver()
        }
    }, [position.top, position.bottom])

    // 销毁观察者
    const disableObserver = () => {
        if (observerObjs.current.length) {
            observerObjs.current.forEach(observerObj => {
                observerObj.disconnect()
            })
        }
    }

    // 解决scrollView置顶后，scrollOffset不为0的问题
    const observePage  = () => {
        const observerObjTop = Taro.createIntersectionObserver().relativeToViewport({ top: -position.top });
        observerObjTop.observe(`#todo-list-scroll-line-view-top`, (res) => {
            const isBool = res.intersectionRatio > 0
        
            if (isBool && resetScroll) {
                resetScroll('top')
            }
        });

        const observerObjBottom = Taro.createIntersectionObserver().relativeToViewport({ bottom: -position.bottom });
        observerObjBottom.observe(`#todo-list-scroll-line-view-bottom`, (res) => {
            const isBool = res.intersectionRatio > 0
        
            if (isBool && resetScroll) {
                resetScroll('bottom')
            }
        });

        observerObjs.current = [observerObjTop, observerObjBottom]
    }

    const renderSkeleton = () => {
        if (SkeletonView) {
            return list.map(_ => {
                return createElement(SkeletonView)
            })
        }
        return []
    }

    return (
        <View className='virtual-container'>
            <View className='virtual-container-line' id='todo-list-scroll-line-view-top'></View>
            {/* 创建骨架视图，改善用户体验 */}
            {
                SkeletonView && list.map((_) => <SkeletonView />)
            }
            <View className='virtual-container-line' id='todo-list-scroll-line-view-bottom'></View>
        </View>
        
    )
}

export default React.memo(Index);