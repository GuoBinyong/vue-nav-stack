import {getVNodeTagAndName,getVueInstTagAndName,forceRefreshVueInst,reinitVueInst,refreshVueInstHooks} from 'vnode-tls'
import {getTypeNameOf} from "com-tools"


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
function performKeepAliveActions(vueInst,alive,componentName){
  var currVNode = vueInst.$vnode;
  var parentVNode = currVNode.parent;


  var actions = alive ? vueInst.activateActions : vueInst.deactivateActions;

  if(parentVNode){
    var parentName = getVNodeTagAndName(parentVNode).name;
    var isKeepAliveChild = parentName == componentName;
  }

  if  (isKeepAliveChild){
    var keepAliveVue = parentVNode.componentInstance;

    if (!actions) {
      actions = alive ? keepAliveVue.activate : keepAliveVue.deactivate;
      if (!actions && !alive && keepAliveVue.navStack){
        actions = navStackDeactivateAction;
      }
    }
  }

  resolveActionOptions(actions,alive,vueInst,isKeepAliveChild,keepAliveVue);
}


/**
 * 扩展 Vue 内置的 KeepAlive 组件
 * @param Vue
 */
function extendKeepAlive(Vue) {

  /*
  KeepAlive 是个抽像组件，经研究发现：
  - 制像组件的不会保存 传给其除 props 之外的属性；但监听事件还是会保存的；
  抽像组件的设置方法是：在组件的配置选项的顶层增加配置项 abstract ，并次其设置为 true ;
   */
  let KeepAlive = Vue.component("KeepAlive");
  let props = KeepAlive.props;
  props.navStack = Boolean;
  props.activate = [String,Object,Array];
  props.deactivate = [String,Object,Array];




//保持激活相关的混合
  let keepAliveMixin = {
    activated:function () {
      performKeepAliveActions(this,true,KeepAlive.name);
    },
    deactivated:function () {
      performKeepAliveActions(this,false,KeepAlive.name);
    }
  };


  Vue.mixin(keepAliveMixin);

}

export const KeepAliveExtendPlugin = {
  install:extendKeepAlive
}

// KeepAliveExtendPlugin：结束









//-------------------------NavStackPlugin------------------------------------


// NavStackPlugin：开始



/**
 * 执行导航栈方案的 actions
 * @param vueInst
 * @param alive
 * @param componentName
 */
function performNavStackActions(vueInst,alive,componentName){
  var keepAliveVue = vueInst.navStackVue;
  if (!keepAliveVue) {
    return;
  }
  var disableAction = keepAliveVue.disableAction;
  if  (disableAction === true || disableAction == "all"){
    return;
  }

  var parentVue = vueInst.$parent;
  var parentName = getVueInstTagAndName(parentVue).name;
  var isKeepAliveChild = parentName == componentName;

  var isDisableAction = (isKeepAliveChild && (disableAction == "son")) || (!isKeepAliveChild && disableAction == "grandson");
  if  (isDisableAction && !needRefreshOnActivated(alive,vueInst)){
    return
  }


  var actions = alive ? vueInst.activateActions : vueInst.deactivateActions;

  if (!actions) {
    actions = alive ? keepAliveVue.activate : keepAliveVue.deactivate;

    if (!actions && isKeepAliveChild && !alive){
      actions = navStackDeactivateAction;
    }

  }


  resolveActionOptions(actions,alive,vueInst,isKeepAliveChild,keepAliveVue);


}





/**
 * 扩展 Vue 内置的 KeepAlive 组件
 * @param Vue
 * @param componentName ?: string   可选；默认值："NavStack"； 注册的组件名字
 */
function installNavStack(Vue,componentName) {

  /*
  KeepAlive 是个抽像组件，经研究发现：
  - 抽像组件的设置方法是：在组件的配置选项的顶层增加配置项 abstract ，并次其设置为 true ;
  - 抽像组件的不会保存 传给其除 props 之外的属性；但监听事件还是会保存的；
  - 给抽像组件配置提供 provide ，该 provide 会被调用，但不生效；
   */
  let KeepAlive = Vue.component("KeepAlive");
  let NavStack = Object.assign({},KeepAlive);
  NavStack.name = "nav-stack";
  NavStack.abstract = false;

  let props = Object.assign({},KeepAlive.props);
  props.activate = [String,Object,Array];
  props.deactivate = [String,Object,Array];
  props.disableAction = [Boolean,String];
  NavStack.props = props;

  var oriProvide = KeepAlive.provide || {};
  NavStack.provide = function () {
    if (typeof oriProvide == "function"){
      var provideObj = oriProvide.apply(this,arguments);
    }else {
      provideObj = Object.assign({},provideObj)
    }

    provideObj.navStackVue = this;

    return provideObj;
  };

Vue.component(componentName || "NavStack",NavStack);



//保持激活相关的混合
  let navStackMixin = {
    activated:function () {
      performNavStackActions(this,true,NavStack.name);
    },
    deactivated:function () {
      performNavStackActions(this,false,NavStack.name);
    },
    inject:{navStackVue:{default:undefined}}
  };


  Vue.mixin(navStackMixin);

}

export const NavStackPlugin = {
  install:installNavStack
}


// NavStackPlugin：结束






//-------------------------公共------------------------------------





// 公共：开始

/**
 * key 常量
 * @type {string}
 */
const key_needRefreshOnActivated = "_needRefreshOnActivated_KeepAlive";

/**
 * 判断是否需在激活时刷新
 * @param alive
 * @param vueInst
 * @return {*}
 */
function needRefreshOnActivated(alive,vueInst) {
  return alive && vueInst[key_needRefreshOnActivated];
}


/**
 * 解决 action 配置选项
 * @param actionOpts : ActionObj.action | ActionObj | [ActionObj]
 * @param alive
 * @param vueInst
 * @param isKeepAliveChild
 * @param keepAliveInst
 */
function resolveActionOptions(actionOpts,alive,vueInst,isKeepAliveChild,keepAliveInst){

  var actionsArr = [];
  if (needRefreshOnActivated(alive,vueInst)){
    actionsArr.unshift({action:"refresh"});
    vueInst[key_needRefreshOnActivated] = false;
  }

  if (actionOpts){
    actionsArr = actionsArr.concat(formatActionOptions(actionOpts));
  }

  if  (actionsArr.length > 0){
    actionsArr.forEach(function (actionObj) {
      resolveAction(actionObj,alive,vueInst,isKeepAliveChild,keepAliveInst);
    });
  }
}


/**
 * 格式化 ActionOptions 为 数组格式
 * @param actionOpts : ActionOptions
 */
function  formatActionOptions(actionOpts) {

  let actionsArr;
  switch (getTypeNameOf(actionOpts)) {
    case "String":{
      actionsArr = [{action:actionOpts}];
      break;
    }
    case "Function":{
      actionsArr = [{action:actionOpts}];
      break;
    }

    case "Array":{
      actionsArr = actionOpts;
      break;
    }

    default:{
      actionsArr = [actionOpts];
    }

  }

  return actionsArr;
}



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
function resolveAction(actionObj,alive,vueInst,isKeepAliveChild,keepAliveInst){
  let {action,condition} = actionObj;

  if (typeof condition == "function"){
    var passed = condition.call(vueInst,alive,vueInst,keepAliveInst);
  }else {
    passed = condition == undefined ? true : condition ;
  }

  if (passed && action){

    if  (typeof action == "function"){
      action.call(vueInst,alive,vueInst,keepAliveInst);
      return
    }

    switch (action) {
      case "mount":{
        vueInst.$mount(vueInst.$el);
        break;
      }
      case "update":{
        vueInst.$foreUpdate();
        break;
      }
      case "destory":{
        if  (isKeepAliveChild){
          vueInst.$destroy();
          clearKeepAliveCache(keepAliveInst,vueInst.$vnode);
        }else {
          vueInst[key_needRefreshOnActivated] = true;
        }
        break;
      }

      case "refresh":{
        forceRefreshVueInst(vueInst);
        break;
      }

      case "refreshHooks":{
        refreshVueInstHooks(vueInst);
        break;
      }

      case "reinit":{
        reinitVueInst(vueInst);
        break;
      }

    }

  }

}


/**
 * 清除 KeepAlive 实例 中缓存的 虚拟节点 vNode ；如果没有传 vNode，则会清空所有的 缓存
 * @param keepAliveInst : KeepAlive
 * @param vNode ?: VNode   可选；虚拟dom ；如果传递了 该参数，则仅会清除该 虚拟 dom 的缓存，如果没传该参数，则会清除所有的缓存
 */
function clearKeepAliveCache(keepAliveInst,vNode){
  if (vNode == undefined)  {
    keepAliveInst.cache =  Object.create(null);
    keepAliveInst.keys = [];
  }else {
    var cacheKey = createCacheKeyOfKeepAliveFor(vNode);

    var cache = keepAliveInst.cache;
    var keys = keepAliveInst.keys;
    delete cache[cacheKey];
    removeArrayItem(keys,cacheKey);
  }

}



/**
 * 失活时默认的 action
 * @type {{condition: (function(): boolean), action: string}}
 */
let navStackDeactivateAction = {
  action:"destory",
  condition:function () {
    return history.navType == "back" ;
  }
};


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
function createCacheKeyOfKeepAliveFor(vnode) {
  // 同一构造函数可能会注册为不同的本地组件
  // 所以，单靠cid是不够的 (#3269)

  if (vnode.key != null) {
    return vnode.key;
  }

  var componentOptions = vnode.componentOptions;
  if  (componentOptions){
    return componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '') ;
  }
  return
}




/**
 * 从数组删除元素
 */
function removeArrayItem (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}


// 公共：结束
