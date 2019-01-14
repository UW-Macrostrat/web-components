import './main.styl'
import {Component} from 'react'
import h from 'react-hyperscript'
import {Tag} from '@blueprintjs/core'
import Dropzone from 'react-dropzone'
import classNames from 'classnames'

FileListItem = (props)->
  {file} = props
  h Tag, {icon: 'document'}, file.name

FileList = (props)->
  {files, placeholder} = props
  placeholder ?= "Choose file..."
  return placeholder unless files? and files.length > 0
  h 'div.files', files.map (file)->h(FileListItem, {file})

class FileUploadComponent extends Component
  ###
  An elaboration of the file upload component
  from BlueprintJS with file drop zone capability
  ###
  @defaultProps: {
    onAddFile: ->
    onCancel: ->
  }
  constructor: ->
    super arguments...

  renderDropzone: ({getRootProps, getInputProps, isDragActive})=>
    {files} = @props
    rootProps = getRootProps()
    className = classNames 'file-upload', {'dropzone-active': isDragActive}
    inputProps = getInputProps()
    inputProps.style = {}
    inputProps.className = 'bp3-large'
    msg = 'Drop files here'
    if not isDragActive
      msg += ", or click to upload"

    h 'div', {className, rootProps...}, [
      h 'label.bp3-file-input.bp3-large', [
        h 'input', inputProps
        h 'div.bp3-file-upload-input', [
          h FileList, {files, placeholder: msg}
        ]
      ]
    ]

  render: ->
    h Dropzone, {
      onDrop: @props.onAddFile
      onFileDialogCancel: @props.onCancel
    }, @renderDropzone

export {FileUploadComponent}
