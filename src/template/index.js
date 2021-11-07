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
document.querySelector("#root").addEventListener('click', (ev) => {
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
      default:
        target = target.parentNode
        break;
    }
  }
})

// 执行事件
const handleevent = (type, target) => {
  if(type === 'copy') {
    fileCopy(target)
  }

  if(type === 'edit') {
    fileEdit(target)
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