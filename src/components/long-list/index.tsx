// @ts-nocheck
import React, { useEffect, forwardRef } from 'react'
import TaroLongList from './long-list'

const Index = forwardRef((props, ref) => {
    const { list } = props

    useEffect(() => {
        if (ref?.current) {
            ref.current.initReceiveProps(props)
        }
    }, [list])

    return (
        <TaroLongList
          ref={ref}
          {...props}
        />
    );
})

export default React.memo(Index)