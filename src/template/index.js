const { postMessage } = window.acquireVsCodeApi();
// 回调队列
const cbs = {}
// 当前文件id
// let targetId = null

// webview通信
const dispatch = (data, cb) => {
  if(cb) {
    const cbid = new Date().getTime()
    data.cbid = cbid
    cbs[cbid] = cb
  }
  postMessage(data)
}

// 事件通知
window.addEventListener('message', ({data}) => {
  const { cbid, status, filepath } = data
  const callback = cbs[cbid]
  callback && callback(status, filepath)
  delete cbs[cbid]
})

// 事件代理
document.body.addEventListener('click', (ev) => {
  let target = ev.target
  while(target) {
    switch (target.className) {
      // 编辑文件名
      case 'operationEdit':
        handleevent('edit', target.parentNode)
        target = null
        break;
      // 复制文件名
      case 'operationCopy':
        handleevent('copy', target.parentNode)
        target = null
        break;
      // 修改背景颜色黑色
      case 'operationBackgroundBlack':
        handleevent('background', target.parentNode, 'black')
        target = null
        break;
      // 修改背景颜色灰色
      case 'operationBackgroundGray':
        handleevent('background', target.parentNode, 'gray')
        target = null
        break;
      // 修改背景颜色黑色
      case 'operationBackgroundWhite':
        handleevent('background', target.parentNode, 'white')
        target = null
        break;
      // 图片弹窗打开
      case 'pic':
        handleevent('openmask', target.parentNode)
        target = null
        break;
      // 图片弹窗关闭
      case 'mask':
        handleevent('closemask', target.parentNode)
        target = null
        break;
      // 窗口图片放大
      case 'maskBig':
        handleevent('maskBig', target.parentNode, 'big')
        target = null
        break;
      // 窗口图片缩小
      case 'maskSmall':
        handleevent('maskSmall', target.parentNode, 'small')
        target = null
        break;
      // 窗口图片背景切换
      case 'maskBg':
        handleevent('maskBg', target.parentNode)
        target = null
        break;
      default:
        target = target.parentNode
        break;
    }
  }
})

// 执行事件
const handleevent = (type, target, params) => {
  if(type === 'copy') {
    fileCopy(target)
  }

  if(type === 'edit') {
    fileEdit(target)
  }

  if(type === 'background') {
    changeBackground(target, params)
  }

  if(type === 'openmask') {
    openmask(target)
  }

  if(type === 'closemask') {
    closemask()
  }

  if(type === 'maskBig' || type === 'maskSmall') {
    maskPicSize(params)
  }

  if(type === 'maskBg') {
    maskPicBg()
  }
}

// 编辑文件名
const fileEdit = (target) => {
  const inputEle = findChildByClassName(target, 'operationInput')
  inputEle.style.display = 'block'
  inputEle.focus()
  inputEle.setSelectionRange(-1, -1)
  inputEle.onblur = () => inputBlur(target, inputEle)
}

// input失焦
const inputBlur = (target, inputEle) => {
  const targetId = target.dataset['path']
  const oldName = targetId.slice(targetId.lastIndexOf('/') + 1)
  const newName = inputEle.value.trim()
  if(newName && newName !== oldName) {
    dispatch({type: 'edit', filepath: targetId, filename: inputEle.value, oldName, content: '文件修改成功！'}, (status, filepath) => {
      if(status === 'success') {
        inputEle.parentNode.setAttribute('data-path', filepath)
        inputEle.style.display = 'none'
        const titleEle = findChildByClassName(target, 'operationTitle')
        titleEle.innerHTML = newName
      } else {
        inputEle.style.display = 'none'
        inputEle.value = oldName
      }
    })
    return
  }
  inputEle.style.display = 'none'
  inputEle.value = oldName
}

// 复制文件名
const fileCopy = (target) => {
  const targetId = target.dataset['path']
  const name = targetId.slice(targetId.lastIndexOf('/') + 1)
  const input = document.createElement('input')
  input.style.position = "fixed"
  input.style.opacity = 0
  document.body.appendChild(input)
  input.value = name
  input.focus()
  input.select()
  if (document.execCommand) {
    document.execCommand('copy')
    postMessage({type: 'message', content: '文件名复制成功！'})
  }
  input.parentNode.removeChild(input)
}

// 查找子元素
const findChildByClassName = (parent, className) => {
  const children = Array.from(parent.children)
  let ele = null
  children.forEach(el => {
    const classs = el.className.split(' ')
    if(classs.includes(className)) {
      ele = el
      return
    }
  })
  return ele
}

// 修改背景颜色
const changeBackground = (target, type) => {
  target.parentNode.parentNode.style.background = type
}

// 图片放大
const openmask = (target) => {
  const filepath = target.querySelector(".pic img").getAttribute("src")
  const mask = document.querySelector("#mask")
  const img = document.createElement('img')
  img.src = filepath
  img.id = "maskPic"
  mask.style.display = 'flex'
  mask.querySelector("#bigimg").appendChild(img)
}

// 关闭窗口
const closemask = () => {
  const mask = document.querySelector("#mask")
  mask.style.display = 'none'
  mask.querySelector("#bigimg").innerHTML = ''
}

// 图片尺寸切换
const maskPicSize = (type) => {
  const img = document.querySelector("#maskPic")
  const size = img.dataset['size'] || 1
  const ratio = type === 'big' ? 1 : -1
  const value = ratio + Number(size)

  if(value < 1) return
  img.style.transform = `scale(${value})`
  img.setAttribute('data-size', value)
}

// 窗口背景切换
const maskPicBg = () => {
  const mask = document.querySelector("#mask")
  const bg = mask.dataset['bg']
  if(bg === 'white') {
    mask.dataset['bg'] = 'black'
    mask.style.background = 'rgba(0, 0, 0, 0.8)'
  } else {
    mask.dataset['bg'] = 'white'
    mask.style.background = 'rgba(255, 255, 255, 0.8)'
  }
}