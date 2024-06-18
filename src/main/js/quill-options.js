import 'quill-mention'
import 'quill-mention/dist/quill.mention.css'
import store from './store/linqa'
import COLOR_PALETTE from './lq-color-palette'

export default {
  theme: 'bubble',
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', {background: COLOR_PALETTE.textBackground}],
        [{list: 'ordered'}, {list: 'bullet'}],
        ['link', 'image', 'video'],
        [{header: [1, 2, 3, false]}]
      ],
      handlers: {
        image: selectLocalImage
      }
    },
    mention: {
      source: usernameSource
    }
  }
}

// Image upload

function selectLocalImage () {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.click()
  input.onchange = () => {
    const file = input.files[0]     // a File object
    console.log(file)
    if (/^image\//.test(file.type)) {
      saveToServer(file, this.quill)
    } else {
      console.warn(`${file.name} is not an image file`)
    }
  }
}

function saveToServer (file, editor) {
  const fd = new FormData()
  const xhr = new XMLHttpRequest()
  fd.append('image', file)
  xhr.open('POST', '/linqa/image')
  xhr.onload = () => {
    if (xhr.status === 200) {
      console.log('response', JSON.parse(xhr.response))
      const url = '/filerepo/' + encodeURIComponent(JSON.parse(xhr.response).repoPath)
      insertToEditor(url, editor)
    } else {
      console.warn(`Upload of ${file.name} failed`)
    }
  }
  xhr.send(fd)
}

function insertToEditor (url, editor) {
  const range = editor.getSelection()
  editor.insertEmbed(range.index, 'image', url)
}

// Mentions

function usernameSource (searchTerm, renderList, mentionChar) {
  const users = store.state.workspace.memberships     // TODO: show Display Names
  if (searchTerm.length === 0) {
    renderList(users, searchTerm)
  } else {
    const matches = []
    for (let i = 0; i < users.length; i++) {
      if (~users[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) {
        matches.push(users[i])
      }
    }
    renderList(matches, searchTerm)
  }
}
