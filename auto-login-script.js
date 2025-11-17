// 自动登录脚本 - 复制到应用页面控制台中运行
// 用于从预发布页面跳转过来时自动填写登录信息

(function() {
    // 检查是否有自动登录信息
    const token = sessionStorage.getItem('auto_login_token');
    const tokenType = sessionStorage.getItem('auto_login_token_type');
    const username = sessionStorage.getItem('auto_login_username');

    if (token) {
        console.log('检测到自动登录信息:', { token: token.substring(0, 20) + '...', tokenType, username });

        // 方案1: 如果应用支持token直接登录
        // 检查URL参数中的token
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');

        if (urlToken) {
            console.log('尝试使用URL token进行自动登录...');
            // 这里可以调用应用的登录API
            // 示例代码（需要根据应用的具体API调整）:
            /*
            fetch('/api/auth/login-with-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: urlToken })
            }).then(response => {
                if (response.ok) {
                    console.log('Token登录成功');
                    // 刷新页面或跳转
                    window.location.reload();
                } else {
                    console.log('Token登录失败，尝试自动填写表单');
                    autoFillLoginForm();
                }
            }).catch(() => {
                console.log('Token登录失败，尝试自动填写表单');
                autoFillLoginForm();
            });
            */
        } else {
            // 方案2: 自动填写登录表单
            autoFillLoginForm();
        }
    } else {
        console.log('未检测到自动登录信息');
    }

    function autoFillLoginForm() {
        // 查找登录表单中的用户名和密码输入框
        // 常见的输入框选择器
        const usernameSelectors = [
            'input[name="username"]',
            'input[name="user"]',
            'input[name="email"]',
            'input[name="login"]',
            'input[type="text"]',
            'input[placeholder*="用户名" i]',
            'input[placeholder*="账号" i]',
            'input[placeholder*="邮箱" i]'
        ];

        const passwordSelectors = [
            'input[name="password"]',
            'input[name="pass"]',
            'input[name="pwd"]',
            'input[type="password"]',
            'input[placeholder*="密码" i]'
        ];

        let usernameInput = null;
        let passwordInput = null;

        // 查找用户名输入框
        for (const selector of usernameSelectors) {
            usernameInput = document.querySelector(selector);
            if (usernameInput && usernameInput.type !== 'password') {
                break;
            }
        }

        // 查找密码输入框
        for (const selector of passwordSelectors) {
            passwordInput = document.querySelector(selector);
            if (passwordInput) {
                break;
            }
        }

        if (usernameInput && username) {
            usernameInput.value = username;
            usernameInput.style.backgroundColor = '#e8f5e8';
            console.log('已自动填写用户名:', username);
        }

        if (passwordInput && token) {
            // 注意：这里无法自动填写密码，因为密码字段通常有安全限制
            // 只能提示用户手动输入或使用其他方式
            passwordInput.style.backgroundColor = '#fff3cd';
            passwordInput.placeholder = '请手动输入密码，或联系开发团队添加token登录支持';

            // 创建一个提示信息
            const hint = document.createElement('div');
            hint.innerHTML = `
                <div style="
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #007bff;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    z-index: 10000;
                    font-size: 14px;
                    max-width: 300px;
                ">
                    <strong>自动登录提示:</strong><br>
                    用户名已自动填写，请手动输入密码完成登录。<br>
                    建议联系开发团队添加token自动登录功能。
                    <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: white; cursor: pointer;">×</button>
                </div>
            `;
            document.body.appendChild(hint);

            console.log('密码字段无法自动填写，请手动输入密码');
        }

        // 清除sessionStorage中的信息（一次性使用）
        sessionStorage.removeItem('auto_login_token');
        sessionStorage.removeItem('auto_login_token_type');
        sessionStorage.removeItem('auto_login_username');
    }

    // 如果页面上有登录按钮，可以自动点击（可选）
    // const loginButton = document.querySelector('button[type="submit"], input[type="submit"], .login-btn');
    // if (loginButton && usernameInput && passwordInput && passwordInput.value) {
    //     setTimeout(() => loginButton.click(), 1000);
    // }
})();
