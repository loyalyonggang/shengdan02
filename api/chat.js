export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 从 Vercel 环境变量中获取 Key
  const API_KEY = process.env.SILICONFLOW_API_KEY;
  const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  try {
    // 转发请求到 SiliconFlow
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // 将结果返回给前端
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
