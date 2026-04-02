import apiConfig from '../config/api.json'
import billingService from './billing.js'
import { ElMessage } from 'element-plus'

class APIService {
  constructor() {
    // 从api.json加载配置，如果为空则使用默认值
    this.config = {
      baseURL: '/api',
      selectedModel: 'qwen3.5:27b',
      temperature: 0.7
    }
    
    // 确保baseURL不为空
    console.log('初始baseURL:', this.config.baseURL)
    
    this.proxyConfig = apiConfig.proxy
    // 尝试从localStorage加载用户配置
    this.loadUserConfig()
    
    console.log('最终API配置:', this.config)
  }
  
  // 加载用户配置
  loadUserConfig() {
    try {
      // 加载自定义配置（本地ollama）
      const saved = localStorage.getItem('customApiConfig')
      if (saved) {
        const userConfig = JSON.parse(saved)
        // 只合并除baseURL外的其他配置，确保baseURL始终使用默认值
        const { baseURL, ...otherConfig } = userConfig
        this.config = { ...this.config, ...otherConfig }
        console.log('加载用户配置，使用默认baseURL')
      }
    } catch (error) {
      console.error('加载用户API配置失败:', error)
      // 加载失败时使用默认配置
    }
  }

  // 获取API配置
  getConfig() {
    return this.config
  }

  // 更新API配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    // 保存到localStorage（只保存到customApiConfig）
    try {
      localStorage.setItem('customApiConfig', JSON.stringify(this.config))
      // 同时更新旧的配置键以保持兼容性
      localStorage.setItem('apiConfig', JSON.stringify(this.config))
    } catch (error) {
      console.error('保存API配置失败:', error)
    }
  }

  // 构建请求URL
  buildURL(endpoint) {
    const url = `${this.config.baseURL}${endpoint}`
    console.log('构建的URL:', url)
    return url
  }

  // 构建请求头
  buildHeaders() {
    // 检查是否是本地ollama
    const isOllama = this.config.baseURL && (this.config.baseURL.includes('localhost:11434') || this.config.baseURL.includes('127.0.0.1:11434') || this.config.baseURL === '/api')
    
    console.log('检测到的baseURL:', this.config.baseURL)
    console.log('是否是ollama:', isOllama)
    
    // 统一返回基本的Content-Type头，本地ollama不需要Authorization头
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  // 通用API请求方法
  async makeRequest(endpoint, options = {}) {
    const url = this.buildURL(endpoint)
    const headers = this.buildHeaders()
    
    const requestOptions = {
      method: 'POST',
      headers,
      ...options
    }

    try {
      const response = await fetch(url, requestOptions)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API请求错误:', error)
      throw error
    }
  }

  // 生成文本内容
  async generateText(prompt, options = {}) {
    const model = options.model || this.config.selectedModel || this.config.defaultModel || 'gpt-3.5-turbo'
    
    // 估算输入token数量（用于记录，无需检查余额）
    const estimatedInputTokens = billingService.estimateTokens(prompt)

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature || this.config.temperature,
      stream: false
    }

    try {
      const response = await this.makeRequest('/chat/completions', {
        body: JSON.stringify(requestBody)
      })

      const content = response.choices[0]?.message?.content || ''
      const usage = response.usage
      
      // 记录实际的token使用情况
      if (usage) {
        billingService.recordAPICall({
          type: options.type || 'generation',
          model: model,
          content: prompt,
          response: content,
          inputTokens: usage.prompt_tokens || 0,
          outputTokens: usage.completion_tokens || 0,
          status: 'success'
        })
      } else {
        // 如果API没有返回usage信息，使用估算值
        const outputTokens = billingService.estimateTokens(content)
        billingService.recordAPICall({
          type: options.type || 'generation',
          model: model,
          content: prompt,
          response: content,
          inputTokens: estimatedInputTokens,
          outputTokens: outputTokens,
          status: 'success'
        })
      }

      return content
    } catch (error) {
      // 记录失败的API调用
      billingService.recordAPICall({
        type: options.type || 'generation',
        model: model,
        content: prompt,
        response: '',
        inputTokens: estimatedInputTokens,
        outputTokens: 0,
        status: 'failed'
      })
      throw error
    }
  }

  // 流式生成文本内容
  async generateTextStream(prompt, options = {}, onChunk = null) {
    console.log('开始流式生成，prompt:', prompt.substring(0, 100) + '...') // 调试日志
    
    // 验证 API 地址
    if (!this.config.baseURL || this.config.baseURL.trim() === '') {
      throw new Error('API 地址未配置，请先在设置中配置 API 地址')
    }
    
    // 确定使用的模型
    const model = options.model || this.config.selectedModel || this.config.defaultModel || 'gpt-3.5-turbo'
    console.log('使用模型:', model)
    
    // 验证prompt参数
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('无效的prompt参数')
    }
    
    // 清理prompt内容，确保JSON序列化安全
    let cleanPrompt = prompt
    try {
      // 移除控制字符和不可见字符
      cleanPrompt = prompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      
      // 确保可以正常JSON序列化
      JSON.stringify({ content: cleanPrompt })
      
      console.log('Prompt清理完成，原长度:', prompt.length, '清理后长度:', cleanPrompt.length)
    } catch (cleanError) {
      console.error('Prompt清理失败:', cleanError)
      throw new Error('提示词包含无法处理的字符，请检查输入内容')
    }
    
    // 估算输入token数量（用于记录，无需检查余额）
    const estimatedInputTokens = billingService.estimateTokens(cleanPrompt)
    
    // 本地模型无 token 限制，直接使用配置中的设置（默认为 null）
    const maxTokens = options.maxTokens !== undefined ? options.maxTokens : this.config.maxTokens
    
    console.log('maxTokens 配置检查:', {
      'options.maxTokens': options.maxTokens,
      'this.config.maxTokens': this.config.maxTokens,
      '最终使用的 maxTokens': maxTokens,
      '是否无限制': maxTokens === null
    })
    
    // 检查是否是本地ollama
    const isOllama = this.config.baseURL && (this.config.baseURL.includes('localhost:11434') || this.config.baseURL.includes('127.0.0.1:11434') || this.config.baseURL === '/api')
    
    console.log('generateTextStream - 检测到的baseURL:', this.config.baseURL)
    console.log('generateTextStream - 是否是ollama:', isOllama)
    
    // 根据是否是ollama构建不同的请求体
    let requestBody
    if (isOllama) {
      // ollama的请求格式
      requestBody = {
        model: model,
        prompt: cleanPrompt,
        stream: true,
        options: {
          temperature: options.temperature || this.config.temperature
        }
      }
    } else {
      // OpenAI的请求格式
      requestBody = {
        model: model,
        messages: [
          {
            role: 'user',
            content: cleanPrompt
          }
        ],
        max_tokens: maxTokens || undefined, // 如果为null则不设置限制
        temperature: options.temperature || this.config.temperature,
        stream: true
      }
    }

    console.log('请求体:', requestBody) // 调试日志
    
    // 根据是否是ollama选择不同的API端点
    const url = isOllama ? this.buildURL('/generate') : this.buildURL('/chat/completions')
    const headers = this.buildHeaders()
    
    console.log('最终API请求URL:', url) // 关键调试日志
    console.log('请求头:', headers) // 关键调试日志
    console.log('请求体:', JSON.stringify(requestBody)) // 关键调试日志
    
    let fullContent = ''
    let hasError = false
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        // 增加超时设置，避免长时间等待导致的截断
        signal: AbortSignal.timeout(300000) // 5分钟超时，给更多时间生成长内容
      })
      
      console.log('API响应状态:', response.status) // 调试日志
      console.log('API响应URL:', response.url) // 关键调试日志

      if (!response.ok) {
        const errorText = await response.text()
        hasError = true
        console.error('API错误响应:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`)
        } catch (parseError) {
          throw new Error(`API请求失败: ${response.status} - ${errorText}`)
        }
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let streamFinished = false
      let buffer = '' // 用于处理分片数据
      let processedChunks = 0 // 统计处理的chunk数量
      let lastProgressTime = Date.now() // 记录最后一次接收数据的时间
      let noDataTimeout = null // 无数据超时检查
      
      // 设置无数据超时检查（30秒没有新数据则认为可能有问题）
      const resetNoDataTimeout = () => {
        if (noDataTimeout) {
          clearTimeout(noDataTimeout)
        }
        noDataTimeout = setTimeout(() => {
          console.log('警告：30秒内没有接收到新数据，但流未结束')
          // 不直接结束，继续等待，但记录警告
        }, 30000)
      }
      
      resetNoDataTimeout()
      
      try {
        while (!streamFinished) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('读取完成，处理了', processedChunks, '个chunks，总内容长度:', fullContent.length)
            if (noDataTimeout) {
              clearTimeout(noDataTimeout)
            }
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          console.log('接收到原始chunk:', chunk.length, '字节') // 调试日志
          
          // 重置无数据超时
          lastProgressTime = Date.now()
          resetNoDataTimeout()
          
          // 将新的chunk添加到缓冲区
          buffer += chunk
          
          // 按行分割，最后一行可能不完整，需要保留
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留最后一行（可能不完整）

          for (const line of lines) {
            const trimmedLine = line.trim()
            
            if (trimmedLine) {
              try {
                const parsed = JSON.parse(trimmedLine)
                let content = ''
                
                // 检查是否是ollama格式
                if (isOllama) {
                  // ollama的响应格式
                  content = parsed.response || ''
                  
                  if (content) {
                    fullContent += content
                    processedChunks++
                    console.log('接收到内容片段:', content.length, '字符，总长度:', fullContent.length)
                    
                    if (onChunk) {
                      try {
                        onChunk(content, fullContent)
                      } catch (chunkError) {
                        console.error('onChunk回调错误:', chunkError)
                      }
                    }
                  }
                  
                  // 检查是否有结束标记
                  if (parsed.done) {
                    console.log('检测到结束标记:', parsed.done)
                    streamFinished = true
                    break
                  }
                } else if (trimmedLine.startsWith('data: ')) {
                  // OpenAI的SSE响应格式
                  const data = trimmedLine.slice(6).trim()
                  
                  if (data === '[DONE]') {
                    console.log('收到[DONE]标记，流式生成完成，总内容长度:', fullContent.length)
                    streamFinished = true
                    break
                  }
                  
                  // 跳过空数据
                  if (!data || data === '') {
                    continue
                  }
                  
                  try {
                    const openaiParsed = JSON.parse(data)
                    content = openaiParsed.choices?.[0]?.delta?.content || ''
                    
                    if (content) {
                      fullContent += content
                      processedChunks++
                      console.log('接收到内容片段:', content.length, '字符，总长度:', fullContent.length)
                      
                      if (onChunk) {
                        try {
                          onChunk(content, fullContent)
                        } catch (chunkError) {
                          console.error('onChunk回调错误:', chunkError)
                        }
                      }
                    }
                    
                    // 检查是否有结束标记
                    if (openaiParsed.choices?.[0]?.finish_reason) {
                      console.log('检测到结束标记:', openaiParsed.choices[0].finish_reason)
                      streamFinished = true
                      break
                    }
                    
                    // 检查是否有错误信息
                    if (openaiParsed.error) {
                      console.error('API返回错误:', openaiParsed.error)
                      throw new Error(`API错误: ${openaiParsed.error.message || '未知错误'}`)
                    }
                  } catch (e) {
                    console.log('解析OpenAI数据失败，原始数据长度:', data.length, '错误:', e.message)
                    // 继续处理其他数据，不中断流式处理
                  }
                }
                
                // 检查是否有错误信息
                if (parsed.error) {
                  console.error('API返回错误:', parsed.error)
                  throw new Error(`API错误: ${parsed.error.message || '未知错误'}`)
                }
              } catch (e) {
                console.log('解析数据失败，原始数据长度:', trimmedLine.length, '错误:', e.message)
                // 如果是API错误，则抛出异常
                if (e.message.startsWith('API错误:')) {
                  throw e
                }
                // 继续处理其他数据，不中断流式处理
              }
            }
          }
        }
        
        // 处理剩余的缓冲区数据
        if (buffer.trim() && !streamFinished) {
          console.log('处理剩余缓冲区数据:', buffer.length, '字符')
          const trimmedLine = buffer.trim()
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6).trim()
            if (data !== '[DONE]' && data !== '') {
              try {
                const parsed = JSON.parse(data)
                let content = ''
                
                // 检查是否是ollama格式
                if (isOllama) {
                  // ollama的响应格式
                  content = parsed.response || ''
                } else {
                  // OpenAI的响应格式
                  content = parsed.choices?.[0]?.delta?.content || ''
                }
                
                if (content) {
                  fullContent += content
                  console.log('缓冲区内容片段:', content.length, '字符，总长度:', fullContent.length)
                  if (onChunk) {
                    onChunk(content, fullContent)
                  }
                }
              } catch (e) {
                console.log('缓冲区数据解析失败:', e.message)
              }
            }
          }
        }
        
        console.log('流式生成最终完成，总处理chunks:', processedChunks, '最终内容长度:', fullContent.length)
        
        // 清理超时检查
        if (noDataTimeout) {
          clearTimeout(noDataTimeout)
        }
        
        // 检查内容完整性
        if (fullContent.length === 0) {
          console.warn('警告：流式生成完成但没有获得任何内容')
        } else if (fullContent.length < 10) {
          console.warn('警告：生成的内容过短，可能被截断:', fullContent)
        }
        
      } catch (streamError) {
        console.error('流式读取错误:', streamError)
        
        // 清理超时检查
        if (noDataTimeout) {
          clearTimeout(noDataTimeout)
        }
        
        // 如果是网络错误或超时，但已经有部分内容，可以考虑返回部分内容
        if (fullContent.length > 0 && (
          streamError.name === 'AbortError' || 
          streamError.message.includes('timeout') ||
          streamError.message.includes('network')
        )) {
          console.log('网络问题导致流式中断，但已获得部分内容:', fullContent.length, '字符')
          ElMessage.warning('网络不稳定，已获得部分生成内容')
          // 不抛出错误，返回已获得的内容
        } else {
          hasError = true
          throw streamError
        }
      } finally {
        try {
          reader.releaseLock()
        } catch (e) {
          console.log('释放reader锁失败:', e.message)
        }
      }

      // 流式生成成功，记录token使用
      const outputTokens = billingService.estimateTokens(fullContent)
      billingService.recordAPICall({
        type: options.type || 'generation',
        model: model,
        content: cleanPrompt,
        response: fullContent,
        inputTokens: estimatedInputTokens,
        outputTokens: outputTokens,
        status: 'success'
      })

      return fullContent
    } catch (error) {
      console.error('流式生成错误:', error)
      // 只有在发生错误时才记录失败调用
      if (hasError) {
        billingService.recordAPICall({
          type: options.type || 'generation',
          model: model,
          content: cleanPrompt,
          response: fullContent,
          inputTokens: estimatedInputTokens,
          outputTokens: billingService.estimateTokens(fullContent),
          status: 'failed'
        })
      }
      throw error
    }
  }

  // 生成小说大纲
  async generateOutline(theme, keywords, template) {
    const templateInfo = template ? `\n参考模板：${template.name} - ${template.description}` : ''
    const keywordList = keywords ? `\n关键词：${keywords}` : ''
    
    const prompt = `请为以下主题生成一个详细的小说大纲：
主题：${theme}${templateInfo}${keywordList}

要求：
1. 生成5-8个章节
2. 每个章节用 ### 开头，后跟章节标题
3. 每个章节下面写2-3句话描述该章节的主要内容
4. 整体结构要完整，有开头、发展、高潮、结局
5. 符合所选模板的风格特点

请直接输出大纲内容：`

    return await this.generateTextStream(prompt, {}, null)
  }

  // 流式生成小说大纲
  async generateOutlineStream(theme, keywords, template, onChunk = null) {
    const templateInfo = template ? `\n参考模板：${template.name} - ${template.description}` : ''
    const keywordList = keywords ? `\n关键词：${keywords}` : ''
    
    const prompt = `请为以下主题生成一个详细的小说大纲：
主题：${theme}${templateInfo}${keywordList}

要求：
1. 生成5-8个章节
2. 每个章节用 ### 开头，后跟章节标题
3. 每个章节下面写2-3句话描述该章节的主要内容
4. 整体结构要完整，有开头、发展、高潮、结局
5. 符合所选模板的风格特点

请直接输出大纲内容：`

    return await this.generateTextStream(prompt, {}, onChunk)
  }

  // 生成章节内容
  async generateChapterContent(chapterTitle, chapterOutline, previousContent = '', template = null, characters = [], worldSettings = [], novelInfo = {}) {
    const templateInfo = template ? `\n写作风格：${template.style}\n写作提示：${template.writingTips}` : ''
    const contextInfo = previousContent ? `\n前文内容参考：${previousContent.slice(-500)}` : ''
    
    // 构建小说基本信息
    let novelBasicInfo = ''
    if (novelInfo.title || novelInfo.genre || novelInfo.intro || novelInfo.theme) {
      novelBasicInfo += '\n\n小说基本信息：'
      if (novelInfo.title) novelBasicInfo += `\n- 小说名称：${novelInfo.title}`
      if (novelInfo.genre) novelBasicInfo += `\n- 小说类型：${novelInfo.genre}`
      if (novelInfo.theme) novelBasicInfo += `\n- 小说主题：${novelInfo.theme}`
      if (novelInfo.intro) novelBasicInfo += `\n- 小说简介：${novelInfo.intro}`
    }
    
    // 构建人物信息
    let charactersInfo = ''
    if (characters.length > 0) {
      charactersInfo = '\n\n人物设定：'
      characters.forEach(char => {
        charactersInfo += `\n- ${char.name}：${char.description}`
        if (char.traits && char.traits.length > 0) {
          charactersInfo += ` (特点：${char.traits.join('、')})`
        }
      })
    }
    
    // 构建世界观信息
    let worldInfo = ''
    if (worldSettings.length > 0) {
      worldInfo = '\n\n世界观设定：'
      worldSettings.forEach(setting => {
        worldInfo += `\n- ${setting.title}：${setting.description}`
      })
    }
    
    const prompt = `请根据以下信息生成小说章节内容：
章节标题：${chapterTitle}
章节大纲：${chapterOutline}${novelBasicInfo}${templateInfo}${contextInfo}${charactersInfo}${worldInfo}

要求：
1. 字数控制在800-1200字
2. 内容要生动有趣，符合章节大纲
3. 语言流畅，描写细腻
4. 如果有前文内容，要保持连贯性
5. 符合所选模板的风格特点
6. 充分利用提供的人物设定和世界观设定
7. 确保人物行为符合其性格特点
8. 场景描写要符合世界观设定
9. 内容要符合小说的整体类型、主题和设定
10. 保持与小说简介和整体风格的一致性

请直接输出章节内容：`

    return await this.generateTextStream(prompt, {}, null)
  }

  // 流式生成章节内容
  async generateChapterContentStream(chapterTitle, chapterOutline, previousContent = '', template = null, characters = [], worldSettings = [], novelInfo = {}, onChunk = null) {
    const templateInfo = template ? `\n写作风格：${template.style}\n写作提示：${template.writingTips}` : ''
    const contextInfo = previousContent ? `\n前文内容参考：${previousContent.slice(-500)}` : ''
    
    // 构建小说基本信息
    let novelBasicInfo = ''
    if (novelInfo.title || novelInfo.genre || novelInfo.intro || novelInfo.theme) {
      novelBasicInfo += '\n\n小说基本信息：'
      if (novelInfo.title) novelBasicInfo += `\n- 小说名称：${novelInfo.title}`
      if (novelInfo.genre) novelBasicInfo += `\n- 小说类型：${novelInfo.genre}`
      if (novelInfo.theme) novelBasicInfo += `\n- 小说主题：${novelInfo.theme}`
      if (novelInfo.intro) novelBasicInfo += `\n- 小说简介：${novelInfo.intro}`
    }
    
    // 构建人物信息
    let charactersInfo = ''
    if (characters.length > 0) {
      charactersInfo = '\n\n人物设定：'
      characters.forEach(char => {
        charactersInfo += `\n- ${char.name}：${char.description}`
        if (char.traits && char.traits.length > 0) {
          charactersInfo += ` (特点：${char.traits.join('、')})`
        }
      })
    }
    
    // 构建世界观信息
    let worldInfo = ''
    if (worldSettings.length > 0) {
      worldInfo = '\n\n世界观设定：'
      worldSettings.forEach(setting => {
        worldInfo += `\n- ${setting.title}：${setting.description}`
      })
    }
    
    const prompt = `请根据以下信息生成小说章节内容：
章节标题：${chapterTitle}
章节大纲：${chapterOutline}${novelBasicInfo}${templateInfo}${contextInfo}${charactersInfo}${worldInfo}

要求：
1. 字数控制在800-1200字
2. 内容要生动有趣，符合章节大纲
3. 语言流畅，描写细腻
4. 如果有前文内容，要保持连贯性
5. 符合所选模板的风格特点
6. 充分利用提供的人物设定和世界观设定
7. 确保人物行为符合其性格特点
8. 场景描写要符合世界观设定
9. 内容要符合小说的整体类型、主题和设定
10. 保持与小说简介和整体风格的一致性

请直接输出章节内容：`

    return await this.generateTextStream(prompt, {}, onChunk)
  }

  // AI对话功能
  async chatWithAI(message, chatHistory = []) {
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的小说写作助手，擅长帮助用户进行创意写作、情节构思、人物塑造等。请用友好、专业的语气回答用户的问题。'
      },
      ...chatHistory.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    const requestBody = {
      model: this.config.selectedModel || this.config.defaultModel || 'gpt-3.5-turbo',
      messages,
      max_tokens: this.config.maxTokens,
      temperature: 0.7
    }

    const response = await this.makeRequest('/chat/completions', {
      body: JSON.stringify(requestBody)
    })

    return response.choices[0]?.message?.content || ''
  }

  // 生成文章摘要
  async generateSummary(content, options = {}) {
    const { length = 'medium', type = 'keypoints' } = options
    
    let lengthInstruction = ''
    switch (length) {
      case 'short':
        lengthInstruction = '请生成50-100字的简短摘要'
        break
      case 'medium':
        lengthInstruction = '请生成100-200字的中等长度摘要'
        break
      case 'long':
        lengthInstruction = '请生成200-300字的详细摘要'
        break
    }
    
    let typeInstruction = ''
    switch (type) {
      case 'keypoints':
        typeInstruction = '重点提取文章的关键要点和核心内容'
        break
      case 'plot':
        typeInstruction = '重点概括故事情节和主要事件'
        break
      case 'character':
        typeInstruction = '重点分析人物特点和关系'
        break
      case 'theme':
        typeInstruction = '重点阐述文章的主题思想和深层含义'
        break
    }
    
    const prompt = `${lengthInstruction}，${typeInstruction}。\n\n文章内容：\n${content}`
    
    return await this.generateTextStream(prompt, {
      maxTokens: null, // 移除token限制
      temperature: 0.3
    }, null)
  }

  // 内容优化建议
  async getWritingAdvice(content) {
    const prompt = `请对以下文章内容提供写作建议：

${content}

请从以下几个方面给出具体建议：
1. 语言表达
2. 情节结构
3. 人物塑造
4. 描写技巧
5. 整体改进方向

建议：`

    return await this.generateTextStream(prompt, { maxTokens: null }, null) // 移除token限制
  }

  // 根据语料库生成个性化内容
  async generatePersonalizedContent(prompt, corpus) {
    const corpusText = corpus.map(item => item.content).join('\n\n')
    const personalizedPrompt = `参考以下写作风格和内容：

${corpusText}

现在请根据上述风格，生成以下内容：
${prompt}

要求：
1. 保持与参考内容相似的写作风格
2. 语言表达要一致
3. 内容要原创且符合要求

生成内容：`

    return await this.generateTextStream(personalizedPrompt, {}, null)
  }

  // 生成通用内容
  async generateGeneralContent(keywords, template, outline, wordLimit = 500) {
    const templateInfo = template ? `\n写作风格：${template.style}\n写作提示：${template.writingTips}` : ''
    const outlineInfo = outline ? `\n参考大纲：${outline}` : ''
    const keywordList = keywords ? `\n关键词：${keywords}` : ''
    
    const prompt = `请根据以下信息生成小说内容：${keywordList}${templateInfo}${outlineInfo}

要求：
1. 字数控制在${wordLimit}字左右
2. 内容要生动有趣，情节引人入胜
3. 语言流畅，描写细腻
4. 符合所选模板的风格特点
5. 如果有大纲，要与大纲保持一致

请直接输出小说内容：`

    return await this.generateTextStream(prompt, {}, null)
  }

  // 流式生成通用内容
  async generateGeneralContentStream(keywords, template, outline, wordLimit = 500, onChunk = null) {
    const templateInfo = template ? `\n写作风格：${template.style}\n写作提示：${template.writingTips}` : ''
    const outlineInfo = outline ? `\n参考大纲：${outline}` : ''
    const keywordList = keywords ? `\n关键词：${keywords}` : ''
    
    const prompt = `请根据以下信息生成小说内容：${keywordList}${templateInfo}${outlineInfo}

要求：
1. 字数控制在${wordLimit}字左右
2. 内容要生动有趣，情节引人入胜
3. 语言流畅，描写细腻
4. 符合所选模板的风格特点
5. 如果有大纲，要与大纲保持一致

请直接输出小说内容：`

    return await this.generateTextStream(prompt, {}, onChunk)
  }

  // 获取可用模型列表
  getAvailableModels() {
    return this.config.models
  }

  // 验证 API 连接
  async validateAPIKey() {
    try {
      // 本地ollama不需要API密钥验证，直接返回成功
      return true
    } catch (error) {
      console.error('API 连接验证失败:', error)
      // 即使出错也返回成功，因为本地ollama不需要验证
      return true
    }
  }

  // AI生成人物
  async generateCharacter(theme, characterType = '') {
    const typeInfo = characterType ? `角色类型：${characterType}` : ''
    const prompt = `请根据主题"${theme}"生成一个小说人物，${typeInfo}

要求：
1. 提供人物的基本信息（姓名、年龄、职业等）
2. 详细的外貌描述
3. 性格特点和行为习惯
4. 背景故事和经历
5. 人物的特殊技能或能力
6. 与主题相关的特征

请以JSON格式返回：
{
  "name": "人物姓名",
  "age": "年龄",
  "occupation": "职业",
  "appearance": "外貌描述",
  "personality": "性格特点",
  "background": "背景故事",
  "skills": ["技能1", "技能2"],
  "traits": ["特征1", "特征2", "特征3"]
}`

    try {
      const response = await this.generateTextStream(prompt, {}, null)
      return JSON.parse(response)
    } catch (error) {
      console.error('生成人物失败:', error)
      throw error
    }
  }

  // AI生成世界观设定
  async generateWorldSetting(theme, settingType = '') {
    const typeInfo = settingType ? `设定类型：${settingType}` : ''
    const prompt = `请根据主题"${theme}"生成一个小说世界观设定，${typeInfo}

要求：
1. 设定的名称和概述
2. 详细的背景描述
3. 重要的规则或法则
4. 地理环境或空间结构
5. 历史背景或重要事件
6. 与主题相关的特色元素

请以JSON格式返回：
{
  "title": "设定名称",
  "overview": "概述",
  "description": "详细描述",
  "rules": ["规则1", "规则2"],
  "geography": "地理环境",
  "history": "历史背景",
  "features": ["特色1", "特色2"]
}`

    try {
      const response = await this.generateTextStream(prompt, {}, null)
      return JSON.parse(response)
    } catch (error) {
      console.error('生成世界观设定失败:', error)
      throw error
    }
  }

  // AI文章分析
  async analyzeArticle(content) {
    try {
      const prompt = `请对以下文章进行深度分析，并以JSON格式返回分析结果：

文章内容：
${content}

请分析以下方面：
1. 情感倾向（积极/消极/中性）
2. 文章标签（最多5个关键标签）
3. 文章分类（玄幻/都市/悬疑/科幻/历史/校园/武侠/其他）
4. 文章评分（0-100分，考虑文笔、情节、结构等）
5. 详细评价（包括优点、缺点、改进建议）

返回格式：
{
  "sentiment": "积极/消极/中性",
  "tags": ["标签1", "标签2", "标签3"],
  "category": "分类",
  "score": 85,
  "evaluation": {
    "strengths": ["优点1", "优点2"],
    "weaknesses": ["缺点1", "缺点2"],
    "suggestions": ["建议1", "建议2"]
  },
  "summary": "整体评价总结"
}`

      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的文学评论家和编辑，擅长分析各种类型的文章。请客观、专业地分析文章，给出建设性的评价和建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }

      console.log('发送文章分析请求:', requestBody)
      
      const url = this.buildURL('/chat/completions')
      const headers = this.buildHeaders()
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('文章分析响应:', data)
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const analysisText = data.choices[0].message.content.trim()
        
        try {
          // 尝试解析JSON响应
          const analysis = JSON.parse(analysisText)
          console.log('解析的分析结果:', analysis)
          return analysis
        } catch (parseError) {
          console.error('解析AI分析结果失败:', parseError)
          // 如果解析失败，返回基础分析结果
          return {
            sentiment: '中性',
            tags: ['AI分析'],
            category: '其他',
            score: 70,
            evaluation: {
              strengths: ['内容完整'],
              weaknesses: ['AI分析解析失败'],
              suggestions: ['请检查内容格式']
            },
            summary: 'AI分析暂时不可用，使用基础分析结果'
          }
        }
      } else {
        throw new Error('AI响应格式错误')
      }
    } catch (error) {
      console.error('文章分析失败:', error)
      throw error
    }
  }

  // AI 批量生成地形（流式版本）
  async generateTerrainsStream(config, onChunk = null) {
    const { 
      count, 
      types, 
      size,
      style, 
      customRequirement 
    } = config

    // 构建地形类型描述
    const typeMap = {
      village: '村庄',
      town: '城镇',
      city: '城市',
      country: '国家',
      continent: '大陆',
      natural: '自然地形'
    }
    const typeInfo = types.map(type => typeMap[type] || type).join('、')
    const styleInfo = style === 'eastern' ? '东方风格' : '西方风格'
    
    // 构建地形大小描述
    const sizeMap = {
      small: '小型',
      medium: '中型',
      large: '大型',
      huge: '超大型'
    }
    const sizeInfo = sizeMap[size] || '中型'

    const customInfo = customRequirement ? `\n特殊要求：${customRequirement}` : ''

    const prompt = `请根据以下要求生成${count}个${typeInfo}类型的小说地形设定：

生成要求：
1. 建筑风格：${styleInfo}
2. 地形大小：${sizeInfo}
3. 命名规则：${style === 'eastern' ? '使用东方风格的中文名称（如：樱花村、月光城、龙脉山）' : '使用西方风格的中文名称（如：翡翠村、星辰城、龙脊山）'}${customInfo}

每个地形请以 JSON 格式返回，包含以下字段：
{
  "name": "地形名称（要有特色，符合风格和类型，使用中文显示）",
  "type": "地形类型（从village、town、city、country、continent、natural中选择）",
  "style": "建筑风格（${style}）",
  "scale": "地形大小（从small、medium、large、huge中选择，默认为${size}）",
  "worldPosition": "在世界中的地理位置（自动生成，要详细描述）",
  "hierarchy": "层级关系字符串（如：隶属于月光领 → 银松森林 → 洛丹伦王国）",
  "description": "详细描述（200-300 字）",
  "biography": "传记历史",
  "economy": "经济产业描述",
  "culture": "文化特色描述",
  "landmarks": ["地标 1", "地标 2", "地标 3"],
  "neighbors": ["相邻地形 1（距离）", "相邻地形 2（距离）"],
  "features": ["特征标签 1", "特征标签 2", "特征标签 3"]
}

重要：
1. 请严格按照上述 JSON 格式返回数据
2. 只返回 JSON 数组，不要任何其他文字、注释或说明
3. 确保 JSON 格式完全正确，没有语法错误
4. 每个字段名必须与上述要求完全一致，不要使用其他字段名
5. 格式严格为：[{},{}]
6. 地形名称必须使用中文显示，${style === 'eastern' ? '东方风格名称要体现东方文化特色（如：樱花、月光、龙脉等）' : '西方风格名称要体现西方文化特色（如：翡翠、星辰、龙脊等）'}

错误示例（不要这样做）：
- 包含任何文字说明
- 使用错误的字段名
- 格式不是标准 JSON
- 地形名称使用英文或其他语言

正确示例（请这样做）：
[
  {
    "name": "樱花村",
    "type": "village",
    "style": "eastern",
    "scale": "small",
    "worldPosition": "位于东方大陆的东部沿海地区",
    "hierarchy": "隶属于月光领 → 银松森林 → 洛丹伦王国",
    "description": "樱花村是一个美丽的小村庄...",
    "biography": "樱花村建立于五百年前...",
    "economy": "以种植樱花和丝绸生产为主",
    "culture": "每年春天举办樱花节",
    "landmarks": ["樱花树王", "樱花神社", "樱花桥"],
    "neighbors": ["银松镇（10公里）", "月光城（50公里）"],
    "features": ["樱花环绕", "丝绸之乡", "和平宁静"]
  }
]

请开始生成：`

    try {
      // 使用流式生成
      const response = await this.generateTextStream(prompt, { model: this.config.selectedModel }, onChunk)
      console.log('流式生成完成，原始响应:', response)
      
      // 尝试从响应中提取 JSON
      let jsonStr = response
      
      // 清理响应内容，移除可能的前缀和后缀
      jsonStr = jsonStr.trim()
      
      // 尝试找到 JSON 数组的开始和结束位置
      const arrayStart = jsonStr.indexOf('[')
      const arrayEnd = jsonStr.lastIndexOf(']')
      
      if (arrayStart !== -1 && arrayEnd !== -1) {
        jsonStr = jsonStr.substring(arrayStart, arrayEnd + 1)
      }
      
      console.log('清理后的 JSON:', jsonStr)
      
      // 尝试解析 JSON
      const terrains = JSON.parse(jsonStr)
      const result = Array.isArray(terrains) ? terrains : [terrains]
      
      // 验证并清理数据结构
      const cleanedTerrains = result.map(terrain => {
        // 确保每个地形都有正确的结构
        return {
          id: Date.now() + Math.random(),
          name: terrain.name || '未命名地形',
          type: terrain.type || 'village',
          style: terrain.style || 'eastern',
          scale: terrain.scale || 'medium',
          worldPosition: terrain.worldPosition || '未知位置',
          hierarchy: terrain.hierarchy || '',
          description: terrain.description || '',
          biography: terrain.biography || '',
          economy: terrain.economy || '',
          culture: terrain.culture || '',
          landmarks: Array.isArray(terrain.landmarks) ? terrain.landmarks : [],
          neighbors: Array.isArray(terrain.neighbors) ? terrain.neighbors : [],
          features: Array.isArray(terrain.features) ? terrain.features : []
        }
      })
      
      console.log('清理后的地形数据:', cleanedTerrains)
      return cleanedTerrains
    } catch (error) {
      console.error('AI 流式生成地形失败，解析错误:', error)
      throw new Error('AI 返回的数据格式不正确，无法解析为 JSON。请重试或检查 API 配置。')
    }
  }

  // 辅助方法：获取地形类型说明
  getTerrainTypeInfo(type) {
    const types = {
      'village': '村庄',
      'town': '城镇',
      'city': '城市',
      'mountain': '山脉',
      'water': '水域（河流/湖泊）',
      'forest': '森林',
      'plain': '平原',
      'desert': '沙漠',
      'island': '岛屿',
      'random': '随机类型'
    }
    return types[type] || '地形'
  }

  // 辅助方法：获取风格说明
  getStyleInfo(style) {
    const styles = {
      'eastern': '东方风格（中式、日式、韩式等，注重传统建筑和文化）',
      'western': '西方风格（欧式、中世纪、哥特等，注重城堡和教堂）',
      'fantasy': '奇幻风格（魔法世界、异世界等，注重奇幻元素）',
      'sci-fi': '科幻风格（未来科技、赛博朋克等，注重科技感）',
      'random': '随机风格'
    }
    return styles[style] || '通用风格'
  }

  // 辅助方法：获取规模说明
  getScaleInfo(scale) {
    const scales = {
      'small': '小型（小村庄、小山丘等，人口较少，建筑简单）',
      'medium': '中型（城镇、中等山脉等，有一定规模）',
      'large': '大型（大城市、大型山脉等，规模宏大）',
      'huge': '超大型（巨型都市、山脉群等，极其庞大）'
    }
    return scales[scale] || '中等规模'
  }

  // AI 批量生成种族（流式版本）
  async generateRacesStream(config, onChunk = null) {
    const { types, style, customRequirement } = config
    const count = config.count || 5
    
    // 构建种族类型描述
    const typeMap = {
      human: '人类',
      elf: '精灵',
      dwarf: '矮人',
      orc: '兽人',
      other: '其他种族'
    }
    const typeInfo = types.map(type => typeMap[type] || type).join('、')
    
    // 构建风格描述
    const styleMap = {
      eastern: '东方风格（如中国古代风格，名字使用中文）',
      western: '西方风格（如欧洲中世纪风格，名字使用西方风格）',
      fantasy: '奇幻风格（融合东西方元素）'
    }
    const styleInfo = styleMap[style] || styleMap.eastern
    
    const prompt = `请根据以下要求生成${count}个${typeInfo}类型的小说种族设定：

要求：
1. 每个种族必须包含：
   - name: 种族名称（符合${styleInfo}）
   - type: 种族类型（human/elf/dwarf/orc/dragon/other）
   - description: 详细描述
   - appearance: 外貌特征
   - culture: 文化传统
   - socialStructure: 社会结构
   - abilities: 特殊能力
   - history: 历史背景

2. 输出格式必须是JSON数组，每个元素是一个种族对象
3. 确保生成的种族设定丰富、有特色，适合小说创作
4. ${customRequirement || '无特殊要求'}

请直接输出JSON格式，不要包含其他文字。`
    
    try {
      const response = await this.generateTextStream(prompt, { model: this.config.selectedModel }, onChunk)
      
      // 清理响应，确保是有效的JSON
      let cleanedResponse = response
      // 移除开头可能的非JSON内容
      const jsonStart = cleanedResponse.indexOf('[')
      if (jsonStart !== -1) {
        cleanedResponse = cleanedResponse.substring(jsonStart)
      }
      // 移除结尾可能的非JSON内容
      const jsonEnd = cleanedResponse.lastIndexOf(']')
      if (jsonEnd !== -1) {
        cleanedResponse = cleanedResponse.substring(0, jsonEnd + 1)
      }
      
      const races = JSON.parse(cleanedResponse)
      
      // 确保返回的是数组
      if (!Array.isArray(races)) {
        throw new Error('AI返回的数据不是数组格式')
      }
      
      // 清理和验证种族数据
      const cleanedRaces = races.map(race => ({
        name: race.name || '',
        type: race.type || 'human',
        description: race.description || '',
        appearance: race.appearance || '',
        culture: race.culture || '',
        socialStructure: race.socialStructure || '',
        abilities: race.abilities || '',
        history: race.history || ''
      }))
      
      return cleanedRaces
    } catch (error) {
      console.error('AI 流式生成种族失败，解析错误:', error)
      throw new Error('AI 返回的数据格式不正确，无法解析为 JSON。请重试或检查 API 配置。')
    }
  }

  // AI 批量生成物品（流式版本）
  async generateItemsStream(config, onChunk = null) {
    const { levels, style, customRequirement } = config
    const count = config.count || 5
    
    // 构建物品等级描述
    const levelInfo = levels.map(level => `${level}级`).join('、')
    
    // 构建风格描述
    const styleMap = {
      eastern: '东方风格（如中国古代风格，名字使用中文）',
      western: '西方风格（如欧洲中世纪风格，名字使用西方风格）',
      fantasy: '奇幻风格（融合东西方元素）'
    }
    const styleInfo = styleMap[style] || styleMap.eastern
    
    const prompt = `请根据以下要求生成${count}个${levelInfo}级别的小说物品设定：

要求：
1. 每个物品必须包含：
   - name: 物品名称（符合${styleInfo}）
   - level: 物品等级（1-5）
   - description: 详细描述
   - attributes: 属性信息（如效果、功能等）
   - biography: 物品传记（仅5级物品需要）

2. 输出格式必须是JSON数组，每个元素是一个物品对象
3. 确保生成的物品设定丰富、有特色，适合小说创作
4. ${customRequirement || '无特殊要求'}

请直接输出JSON格式，不要包含其他文字。`
    
    try {
      const response = await this.generateTextStream(prompt, { model: this.config.selectedModel }, onChunk)
      
      // 清理响应，确保是有效的JSON
      let cleanedResponse = response
      // 移除开头可能的非JSON内容
      const jsonStart = cleanedResponse.indexOf('[')
      if (jsonStart !== -1) {
        cleanedResponse = cleanedResponse.substring(jsonStart)
      }
      // 移除结尾可能的非JSON内容
      const jsonEnd = cleanedResponse.lastIndexOf(']')
      if (jsonEnd !== -1) {
        cleanedResponse = cleanedResponse.substring(0, jsonEnd + 1)
      }
      
      const items = JSON.parse(cleanedResponse)
      
      // 确保返回的是数组
      if (!Array.isArray(items)) {
        throw new Error('AI返回的数据不是数组格式')
      }
      
      // 清理和验证物品数据
      const cleanedItems = items.map(item => ({
        name: item.name || '',
        level: item.level || '1',
        description: item.description || '',
        attributes: item.attributes || '',
        biography: item.biography || ''
      }))
      
      return cleanedItems
    } catch (error) {
      console.error('AI 流式生成物品失败，解析错误:', error)
      throw new Error('AI 返回的数据格式不正确，无法解析为 JSON。请重试或检查 API 配置。')
    }
  }
}

export default new APIService()