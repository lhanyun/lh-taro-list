import React from 'react'
import VirtualList from "./react";
import ObserverView from './observer-view';

const Index = (props) => {
    return (
        <VirtualList {...props} observerView={ObserverView}>{props.children}</VirtualList>
    )
}

export default Index;
