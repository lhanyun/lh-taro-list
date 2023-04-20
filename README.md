## taro 小程序长列表组件

## DEMO

### VirtualList

```
import React, { Component } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { VirtualList } from 'smb-taro-list'
import 'smb-taro-list/dist/style/index.scss'
import './index.scss'

const Row = React.memo(({ id, index, style, data }) => {
  return (
    <View id={id} className={index % 2 ? 'test1' : 'test2'} style={style}>
      Row {index} : {data[index]}
    </View>
  );
})


function buildData (offset = 0) {
  return Array(100).fill(0).map((_, i) => i + offset);
}

function buildSizeList () {
  return Array(100).fill(0).map((_, i) => i % 2 ? 100 : 50);
}

export default class Index extends Component {

  state = {
    data: buildData(0),
  }

  render() {
    const { data } = this.state
    const dataLen = data.length
    const itemSize = 100

    return (
      <VirtualList
        className='List'
        height={501}
        itemData={data}
        itemCount={dataLen}
        itemSize={itemSize}
        customSize
        unlimitedSize
        sizeList={buildSizeList()}
        width='100%'
        onScroll={({ scrollDirection, scrollOffset }) => {}}
      >
          {Row}
      </VirtualList>
    );
  }
}
```

### LongList

```
import React, { useEffect, useRef, useState } from 'react'
import { View } from '@tarojs/components'
import { LongList } from 'smb-taro-list'

const sizeList = new Array(100).fill(-1).map((_, index) => {
    const num = Math.ceil(Math.random()*10);
    const height = `${num * 40}px`;

    return height;
})

const Index = () => {
    const [list, setList] = useState([])
    const pageNum = useRef(1)
    const [heights, setHeights] = useState(sizeList)
    const virtualListRef = useRef()

    useEffect(() => {
        setList(new Array(50).fill(-1).map((_, index) => index))
    }, [])

    const updateItemHeight = (pageIndex, index) => {
      heights[index] = 100
      setHeights([...heights])
      if (virtualListRef.current) {
        virtualListRef.current.updateHeight({pageIndex, index})
      }
    }

    const renderFunc = ({data:item, index, pageIndex, id, isDisplay, height}) => {
      const color = index % 2 === 0 ? 'red' : 'blue'

      return (
        <View>
          {
            isDisplay ? (
              <View id={id}  style={{height: heights[index], background: color}} onClick={() => updateItemHeight(pageIndex, index)}>
                {`当前是第${item}个元素，是第${pageIndex}屏的数据`}
              </View>
            ) : (
              <View id={id} style={{height}}>{`当前是第${item}个元素，是第${pageIndex}屏的骨架图数据`}</View>
            )
          }
        </View>
      )
    }

    const handleBottom = () => {
      console.log('触底了')
    }
    const handleComplete = () => {
      console.log('加载完成')
    }
    const handleScrollToLower = () => {
      console.log('更新');
      const arr = []
      Array(10).fill(0).forEach((item, index) => {
        arr.push(list.length + index)
      })
      let _list = [...list]
      _list = _list.concat(arr)
      setTimeout(() => {
        pageNum.current = pageNum.current + 1
        setList(_list)
      }, 1000)

    }
    return (
        <LongList
          ref={virtualListRef}
          list={list}
          pageNum={pageNum.current}
          listType="multi"
          onRender={renderFunc}
          onBottom={handleBottom}
          onComplete={handleComplete}
          isSkeleton
          scrollViewProps={{
            style: {
              "height": '100vh',
            },
            onScrollToLower: handleScrollToLower,
          }}
        />
    );
}

export default React.memo(Index)
```
