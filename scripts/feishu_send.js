const crypto = require('crypto');

function genSign(timestamp, secret) {
    const sign = crypto.createHmac('sha256', secret)
        .update(`${timestamp}\n${secret}`)
        .digest('base64');
    return sign;
}

exports.sendTextMsg = async function(text, robotId, secret) {
    if (!robotId || !secret) {
        return;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = genSign(timestamp, secret);
    const url = `https://open.feishu.cn/open-apis/bot/v2/hook/${robotId}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    const data = {
        'timestamp': timestamp.toString(),
        'sign': sign,
        'msg_type': 'text',
        'content': { text }
    };
    const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    };
    try {
        const response = await fetch(url, options);
        await response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}