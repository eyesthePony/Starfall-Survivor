import { _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass("EventBus")
export class EventBus {
    private static _handlers:{[key:string]:any[]} = {};

    public static on(eventName:string, handler:Function, target:any){
        let objHandler = {handler:handler, target:target};
        let handlerList = this._handlers[eventName];
        if(!handlerList){
            handlerList = [];
            EventBus._handlers[eventName] = handlerList;
        }

        for(let i = 0; i < handlerList.length; i++){
            if(!handlerList[i]){
                handlerList[i] = objHandler;
                return i;
            }else if(handlerList[i].handler === objHandler.handler && handlerList[i].target === objHandler.target){
                return i;
            }
        }

        handlerList.push(objHandler);
        return handlerList.length;

    }


    public static off(eventName:string, handler:Function, target:any){
        let objHandler = {handler:handler, target:target};

        let handlerList = this._handlers[eventName];

        if(!handlerList){
            return;
        }

        for(let i = 0; i < handlerList.length; i++){
            if(!handlerList[i]){
                continue;
            }
            if(handlerList[i].handler === objHandler.handler && handlerList[i].target === objHandler.target){
                handlerList[i] = null;
                break;
            }
        }

    }

    public static dispatchEvent (eventName: string, ...args: any){
        let handlerList = this._handlers[eventName];

        if(!handlerList){
            return;
        }

         // 直接遍历原数组，不用 slice()。即使外部在回调里调用了 off，也不会引发致命错误
        for (let i = 0; i < handlerList.length; ++i) {
            let item = handlerList[i];
            if (item && item.handler) {
                item.handler.apply(item.target, args);
            }
        }

    }


}