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

        let list = handlerList.slice();
        for (let i = 0; i < list.length; ++i) {
            if (list[i]) {
                list[i].handler.apply(list[i].target, args);
            }
        }

    }


}