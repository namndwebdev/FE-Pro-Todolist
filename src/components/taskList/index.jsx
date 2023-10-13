import { useState, useRef } from 'react'
import { Skeleton, Pagination, Input, Space, Form, Upload, Button, Avatar, Row } from 'antd'
import { useFetching } from '@/customHook/useFetching'
import { render } from '@/common/renderHelper'
import { ReloadOutlined, CloseOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {getTasks, createTask, deleteTask, addImgTask} from '@/services/task'
import TaskDetailModal from '../Modals/TaskDetail'
import { openModal } from '@/redux/modal'
import { useDispatch } from 'react-redux'
import useNotification from '@/customHook/useNotify'
import { beforeUpload, getBase64 } from '@/common/imageHelper'
export default function TaskList(props){
    const pendingCallAPI = useRef(null)
    const [form] = Form.useForm();
    const [isAddNew, setIsAddNew] = useState(false) 
    const {data, loading, error, page, loadPage, reload} = useFetching(getTasks)
    const dispatch = useDispatch()
    const {contextHolder, infoNotify, errorNotify } = useNotification()
    const [uploadImgTask, setUploadImgTask] = useState({
      base64: '',
      fileOriginObj: null
    })
    function toggleAddNew(){
      setIsAddNew(!isAddNew)
    }
    async function handleAddNew(values){
      try {
        let {title} = values
        form.resetFields();
        pendingCallAPI.current.disabled = true
        let newTask = await createTask(title)
        newTask = newTask.data
        await addImgTask(uploadImgTask.fileOriginObj, newTask.id)
        pendingCallAPI.current.disabled = false
        reload()
        setIsAddNew(false)
      } catch (error) {
        console.log('loi', error);
        pendingCallAPI.current.disabled = false
      }
    }
    function handleOpenModal(task){
      dispatch(openModal(task))
    }
    const handleChange = (info) => {
      console.log('...',info);
     
      getBase64(info.file, (url) => {
        setUploadImgTask({
          base64: url,
          fileOriginObj: info.fileList[0].originFileObj
        })
      });
    };
    const uploadButton = (
      <div>
         <PlusOutlined />
        <div
          style={{
            marginTop: 8,
          }}
        >
          Upload
        </div>
      </div>
    );

    const uploadComponent = (
      <Upload
        name="files"
        showUploadList={false}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        listType="picture-card"
        className="avatar-uploader"
      >
        {uploadImgTask.base64 ? <img
            src={uploadImgTask.base64}
            alt="task img"
            style={{
              width: '100%',
          }}
        /> : uploadButton}
      </Upload>
    )
    
    const inputNewArea = (
      <Form 
        onFinish={handleAddNew}
        form={form}
      >
        {uploadComponent}
        <Space>
          <Form.Item name='title' style={{marginBottom: 0}}>
            <Input placeholder='Enter Task Title'></Input>
          </Form.Item>
          <Button ref={pendingCallAPI} type='primary' htmlType='submit'>Add</Button>
          <CloseOutlined onClick={toggleAddNew}/>
        </Space>
      </Form>
    )

    const element = (
      <>
        {contextHolder}
        <TaskDetailModal 
          onOk={()=>{
            reload()
          }}
          onDelete={()=>{
            reload()
          }}
        />
        <div className="list">
          <h3 className="list-title">{props.title}</h3>
          <Pagination 
          showSizeChanger
          onChange={(pageNumber, pageSize)=>{
            loadPage(pageNumber, pageSize)
          }} current={page.page} total={page.total} pageSize={page.pageSize}/>
          <ul className="list-items">
            {
              loading ? Array(10).fill(0).map((item, index)=><Skeleton key={index} active />) : 
              data?.sort((task1, task2)=>{
                let timeTask1 = new Date(task1?.attributes?.createdAt)
                let timeTask2 = new Date(task2?.attributes?.createdAt)
                if(timeTask1 > timeTask2) return 1
                if(timeTask1 < timeTask2) return -1
                if(timeTask1 == timeTask2) return 0
              }).map(item=>{
                return (
                  <li key={item?.id} onClick={()=>{
                    handleOpenModal(item)
                  }}>
                    <Row justify="space-between" align="middle">
                      <Avatar src={`https://backoffice.nodemy.vn${item?.attributes?.image?.data?.attributes?.url}`}>
                        {item?.attributes?.title.substring(0, 1).toUpperCase()}
                      </Avatar>
                      {item?.attributes?.title}
                      <DeleteOutlined onClick={async (e)=>{
                        try {
                          e.stopPropagation()
                          await deleteTask(item?.id)
                          reload()
                        } catch (error) {
                          errorNotify('topRight', 'Không thành công', `Xoá taskID ${item?.id}`)
                        }
                      }}/>
                    </Row>
                  </li>
                )
              })
            }
          </ul>
        
          {
            isAddNew ? 
            inputNewArea : 
            <button className="add-card-btn btn" onClick={toggleAddNew}>Add a card</button>
          }
        </div>
      </>
    )
    

    let btnReload = <Button 
      icon={<ReloadOutlined />} 
      onClick={()=>{
        reload()
      }}>Reload</Button>
    return render(
      loading,
      error,
      element,
      btnReload
    )
}