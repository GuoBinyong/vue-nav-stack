import Vue,{VueConstructor,VNode} from "vue"

/*
封装了 KeepAliveExtendPlugin 和  NavStackPlugin 这两个Vue插件；

KeepAliveExtendPlugin : 对 Vue 内置的 KeepAlive 组件进行了扩展，使其可通过配置来定制 组件 在 激活 和 失活 时的行为，并实现了 导航栈 NavStack 的功能；
NavStackPlugin : 封装了一个 NavStack 组件；该组件可通过配置来定制 组件 在 激活 和 失活 时的行为，并实现了 导航栈 NavStack 的功能；

注意：
KeepAliveExtendPlugin 和 NavStackPlugin 是两个独立的 Vue 插件，并无依赖，这两个插件功能一样，仅有少许差异，下文会详述


# 导航栈 NavStack 的功能描述如下：
- 在页面导航的过程中，对于 推入的组件会 创建该组件的实例；
- 对于在导航栈中的组件（即：当前 组件 及其 之前的组件），会一直保持激活，并不会被销毁，所以，当返回到之前的组件时，之前的组件并不会重新创建，而是直接渲染之前的组件实例，并不会调用组件的 created 及之前的生命周期函数；
- 对于导航栈外的组件（比如：从 A 页面 返回 到 B 页面，这个过程中，B 页面在导航栈的栈顶，而 A 页面已经不在导航栈内了），会自动销毁，当下次再跳转到该组件时，该组件会被重新创建；

应用场景描述：
这个功能可以解决：Vue的单页面应用在页面返回时仍然会重新创建页面实例，导致页面的初始数据重新被获取、加载 的问题；



# 新增接口：

## KeepAliveExtendPlugin 插件给 keep-alive 组件新增的接口：

### keep-alive新增接口：
给 keep-alive 新增了以下 props （注意：这些 props 的配置目标都是：keep-alive 的直接子组件 ）:
activate ?: ActionOptions    可选；默认值：undefined，即什么也不做；目标：keep-alive 的直接子组件； 当 keep-alive 的直接子组件激活时需要做的操作的配置选项；
deactivate ?: ActionOptions    可选；默认值：undefined，即什么也不做；目标：keep-alive 的直接子组件； 当 keep-alive 的直接子组件失活时需要做的操作的配置选项；
navStack ?: boolean    可选；默认值：false; 目标：keep-alive 的直接子组件；表示是否开启 导航栈 功能；如果开启该功能，会在 keep-alive 的直接子组件 没有配置 失活 操作选项 ActionOptions 时，默认使用 navStackDeactivateAction ,该 Action 会在返回时销毁被返回的组件；




### keep-alive的后代组件的新增接口：
给 keep-alive 的 所有后代组件 增加了以下属性（可以通过 计算属性、data、props、直接在 组件实例上添加的属性  等方式来提示）:
activateActions ?: ActionOptions    可选；默认值：undefined；目标：当前组件；如果提供该属性，则会覆盖 keep-alive 的 activate 提供的值；
deactivateActions ?: ActionOptions    可选；默认值：undefined；目标：当前组件；如果提供该属性，则会覆盖 keep-alive 的 deactivate 提供的值；




## NavStackPlugin 插件给 NavStack 定义的接口：
NavStack 组件具有 与 Vue内置的原来 keep-alive 组件相同的接口，除此之外，还有以下新增接口
### NavStack的新增接口：
给 NavStack 新增了以下 props （注意：这些 props 的配置目标都是：keep-alive 的直接子组件 ）:
activate ?: ActionOptions    可选；默认值：undefined，即什么也不做；目标：NavStack 的后代组件； 当 NavStack 的后代组件激活时需要做的操作的配置选项；
deactivate ?: ActionOptions    可选；默认值：undefined，即什么也不做；目标：NavStack 的后代组件； 当 NavStack 的后代组件失活时需要做的操作的配置选项；当 后代组件 是 NavStack 的直接子组件时，如果 没有配置 deactivate ，默认会使用 navStackDeactivateAction ,该 Action 会在返回时销毁被返回的组件；
disableAction ?: boolean | "son" | "grandson" | "all"  可选；默认值：false ； 表示是否禁用 action ，以及禁用 action 的范围；
  - "son" : 会禁用 NavStack 的直接子组件的 acton ，即：不会对 NavStack 的直接子组件执行 action ；
  - "grandson" : 会禁用 NavStack 的除直接子组件的其它后代组件的 acton ，即：不会对 NavStack 的除直接子组件的其它后代组件执行 action ；
  - "all" : 会禁用所有的 action ；
  - true : 同  "all"
  - false : 取消禁用


### NavStack的后代组件的新增接口：
给 NavStack 的 所有后代组件 增加了以下属性（可以通过 计算属性、data、props、直接在 组件实例上添加的属性  等方式来提示）:
activateActions ?: ActionOptions    可选；默认值：undefined；目标：当前组件；如果提供该属性，则会覆盖 NavStack 的 activate 提供的值；
deactivateActions ?: ActionOptions    可选；默认值：undefined；目标：当前组件；如果提供该属性，则会覆盖 NavStack 的 deactivate 提供的值；





ActionOptions = ActionObj.action | ActionObj | [ActionObj]

ActionObj = {action,condition}
action : "mount" | "update" | "destory" | "refresh" | "refreshHooks" | "reinit" |  "nothing" | (alive:boolean,vueInst:VueComponent,keepAliveInst:VueComponent)=>Void     当条件满足时，需要执行的操作
condition ?: boolean | (alive:boolean,vueInst:VueComponent,keepAliveInst:VueComponent)=>boolean  可选；默认值：true；当 condition 的值是函数时，该函数的this的值是 vueInst




action 的各种值的作用如下：
"mount" : 通过 vue 的  $mount() 方法重新进行挂载操作
"update" : 通过 vue 的  $foreUpdate() 方法进行更新操作
"destory" : 当 vue 组件是 直接子组件时，会让 通过 $destroy() 让 vue 组件销毁；当 vue 组件不是直接子组件时，并在该组件 重新被激活时 执行 "refresh" 操作；
"refresh" : 刷新Vue实例，会先销毁 vue 实例，然后再执行初始化和挂载操作；
"refreshHooks" : 刷新Vue实例的钩子，即：依次调用 vue 实例的以下生命周期 钩子 ["beforeCreate","created","beforeMount","mounted"]
"reinit" : 重新初始化Vue实例；
"nothing" : 什么也不做；
(alive:boolean,vueInst:VueComponent,keepAliveInst:VueComponent)=>Void : 执行自定义的操作


 */




//-------------------------KeepAliveExtendPlugin------------------------------------



// KeepAliveExtendPlugin：开始


/**
 * 执行导航栈方案的 actions
 * @param vueInst
 * @param alive
 * @param componentName
 */
declare function performKeepAliveActions(vueInst:Vue,alive:boolean,componentName:string):void;





/**
 * 扩展 Vue 内置的 KeepAlive 组件
 * @param Vue
 */
export const KeepAliveExtendPlugin:{ install:(Vue:VueConstructor)=>void}

// KeepAliveExtendPlugin：结束











//-------------------------NavStackPlugin------------------------------------


// NavStackPlugin：开始



/**
 * 执行导航栈方案的 actions
 * @param vueInst
 * @param alive
 * @param componentName
 */

declare function performNavStackActions(vueInst:Vue,alive:boolean,componentName:string):void;








/**
 * 扩展 Vue 内置的 KeepAlive 组件
 * @param Vue
 * @param componentName ?: string   可选；默认值："NavStack"； 注册的组件名字
 */
export const NavStackPlugin:{ install:(Vue:VueConstructor,componentName?:string)=>void }


// NavStackPlugin：结束






//-------------------------公共------------------------------------


declare module "vue/types/vue" {
    interface Vue {
        activateActions ?: ActionOpts;   //可选；默认值：undefined；目标：当前组件；如果提供该属性，则会覆盖 NavStack 的 activate 提供的值；
        deactivateActions ?: ActionOpts;  //可选；默认值：undefined；目标：当前组件；如果提供该属性，则会覆盖 NavStack 的 deactivate 提供的值；
    }
}




// 公共：开始

/**
 * key 常量
 * @type {string}
 */
declare const key_needRefreshOnActivated:"_needRefreshOnActivated_KeepAlive";


/**
 * 判断是否需在激活时刷新
 * @param alive
 * @param vueInst
 * @return boolean
 */
declare function needRefreshOnActivated(alive:boolean,vueInst:Vue):boolean;


type ActionFun = (alive:boolean,vueInst:Vue,keepAliveInst:Vue)=>void

type Action = "mount" | "update" | "destory" | "refresh" | "refreshHooks" | "reinit" |  "nothing" | ActionFun

type ConditionFun = (alive:boolean,vueInst:Vue,keepAliveInst:Vue)=>boolean ;
type Condition = boolean | ConditionFun ;


interface ActionObj {
    action:Action;   //当条件满足时，需要执行的操作
    condition ?: Condition;  //可选；默认值：true；当 condition 的值是函数时，该函数的this的值是 vueInst
}

type ActionOpts = Action | ActionObj | ActionObj[]



/**
 * 解决 action 配置选项
 * @param actionOpts : ActionObj.action | ActionObj | [ActionObj]
 * @param alive
 * @param vueInst
 * @param isKeepAliveChild
 * @param keepAliveInst
 */
declare function resolveActionOptions(actionOpts:ActionOpts,alive:boolean,vueInst:Vue,isKeepAliveChild:boolean,keepAliveInst:Vue):void;



/**
 * 格式化 ActionOptions 为 数组格式
 * @param actionOpts : ActionOptions
 */
declare function  formatActionOptions(actionOpts:ActionOpts):ActionObj[];






/**
 * 解决 action
 * @param actionObj : ActionObj
 * @param alive : boolean
 * @param vueInst
 * @param isKeepAliveChild : boolean
 * @param keepAliveInst
 *
 * ActionObj = {action,condition}
 * action : "mount" | "update" | "destory" | "nothing" | refresh | refreshHooks | (alive:boolean,vueInst:VueComponent,keepAliveInst:VueComponent)=>Void     当条件满足时，需要执行的操作
 * condition ?: boolean | (alive:boolean,vueInst:VueComponent,keepAliveInst:VueComponent)=>boolean  可选；默认值：true；当 condition 的值是函数时，该函数的this的值是 vueInst
 */
declare function resolveAction(actionObj:ActionObj,alive:boolean,vueInst:Vue,isKeepAliveChild:boolean,keepAliveInst:Vue):void;




/**
 * 清除 KeepAlive 实例 中缓存的 虚拟节点 vNode ；如果没有传 vNode，则会清空所有的 缓存
 * @param keepAliveInst : KeepAlive
 * @param vNode ?: VNode   可选；虚拟dom ；如果传递了 该参数，则仅会清除该 虚拟 dom 的缓存，如果没传该参数，则会清除所有的缓存
 */
declare function clearKeepAliveCache(keepAliveInst:Vue,vNode?:VNode):void;






/**
 * 失活时默认的 action
 * @type {{condition: (function(): boolean), action: string}}
 */
declare let navStackDeactivateAction:ActionObj;





/**
 * 给虚拟dom生成 用于 KeepAlive 的缓存 cache 的 并且 符合 KeepAlive 规则的 key
 * @param vnode : VNode    虚拟 dom
 * @return string

 注意：
 该规则是通过检查 KeepAlive 的原码抽离出来的；如果将来没生效，请查看基原码的规则是否有改动；
 原逻辑是：
 var key = vnode.key == null
 // same constructor may get registered as different local components
 // so cid alone is not enough (#3269)
 ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
 : vnode.key;

 */
declare function createCacheKeyOfKeepAliveFor(vnode:VNode):string;






/**
 * 从数组删除元素
 */
declare function removeArrayItem<Item>(arr:Item[], item:Item):Item[]|undefined;


// 公共：结束
