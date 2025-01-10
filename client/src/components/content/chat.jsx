import React, {
  forwardRef,
  Fragment,
  useImperativeHandle, useRef
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GptIcon } from '../../assets'
import { insertNew } from '../../redux/messages'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './style.scss'
import instance from '../../config/instance'

const Chat = forwardRef(({ error, currentModel }, ref) => {
  const dispatch = useDispatch()
  const contentRef = useRef()

  const { user, messages } = useSelector((state) => state)
  const { latest, content, all } = messages

  const loadResponse = (stateAction,
    response = content,
    chatsId = latest?.id) => {

    clearInterval(window.interval)

    stateAction({ type: 'resume', status: true })

    contentRef?.current?.classList?.add("blink")

    let index = 0

    window.interval = setInterval(() => {
      if (index < response.length && contentRef?.current) {
        if (index === 0) {
          dispatch(insertNew({ chatsId, content: response.charAt(index) }))
          contentRef.current.innerHTML = response.charAt(index)
        } else {
          dispatch(insertNew({ chatsId, content: response.charAt(index), resume: true }))
          contentRef.current.innerHTML += response.charAt(index)
        }
        index++
      } else {
        stopResponse(stateAction)
      }
    }, 20)
  }

  const stopResponse = (stateAction) => {
    if (contentRef?.current) {
      contentRef.current.classList.remove('blink')
    }
    stateAction({ type: 'resume', status: false })
    clearInterval(window.interval)
  }

  const handleContinue = async (prompt, chatId) => {
    try {
      const response = await instance.put("/api/chat/", {
        prompt,
        chatId,
        model: currentModel
      });
      
      if (response?.data) {
        const { content } = response?.data?.data;
        dispatch(insertNew({ fullContent: content, chatsId: chatId }));
        loadResponse(stateAction, content, chatId);
      }
    } catch (err) {
      console.error(err);
      stateAction({ type: "error", status: true });
    }
  };

  useImperativeHandle(ref, () => ({
    stopResponse,
    loadResponse,
    clearResponse: () => {
      if (contentRef?.current) {
        contentRef.current.innerHTML = ''
        contentRef?.current?.classList.add("blink")
      }
    }
  }))

  return (
    <div className='Chat'>
      {
        all?.filter((obj) => {
          return !obj.id ? true : obj?.id !== latest?.id
        })?.map((obj, key) => {
          return (
            <Fragment key={key}>
              <div className='qs'>
                <div className='acc'>
                  {user?.fName?.charAt(0)}
                </div>
                <div className='txt'>
                  {obj?.prompt}
                </div>
              </div>

              <div className="res">
                <div className='icon'>
                  <GptIcon />
                </div>
                <div className='txt'>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                          <pre className={className}>
                            <code {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {obj?.content}
                  </ReactMarkdown>
                </div>
              </div>
            </Fragment>
          )
        })
      }

      {
        latest?.prompt?.length > 0 && (
          <Fragment>
            <div className='qs'>
              <div className='acc'>
                {user?.fName?.charAt(0)}
              </div>
              <div className='txt'>
                {latest?.prompt}
              </div>
            </div>

            <div className="res">
              <div className='icon'>
                <GptIcon />
                {error && <span>!</span>}
              </div>
              <div className='txt'>
                {
                  error ? <div className="error">
                    Something went wrong. If this issue persists please contact us through our help center at help.signaltech.xyz.
                  </div> : <span ref={contentRef} className="blink" />
                }
              </div>
            </div>
          </Fragment>
        )
      }
    </div>
  )
})

export default Chat