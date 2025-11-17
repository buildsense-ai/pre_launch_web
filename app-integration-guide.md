# 应用集成指南 - 处理预发布页面跳转登录

## 问题描述
预发布页面(3005端口)用户登录成功后，跳转到应用页面(3003端口)时，由于跨域(localStorage隔离)，应用页面无法直接使用预发布页面存储的token。

## 解决方案
在应用页面添加URL token处理功能，让用户跳转过来时自动完成登录。

## 具体实现

### 1. 修改应用页面的JavaScript

在应用页面的主JavaScript文件中添加以下代码：

```javascript
// 检查URL参数中的外部token并自动登录
async function handleExternalLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    const externalToken = urlParams.get('token');
    const tokenType = urlParams.get('token_type') || 'bearer';

    if (externalToken) {
        try {
            console.log('检测到外部token，尝试自动登录...');

            // 调用应用的后端API，用外部token换取应用自己的token
            const response = await fetch('/auth/login-with-external-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    external_token: externalToken,
                    token_type: tokenType,
                    source: 'prelaunch_page'
                })
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                // 登录成功，存储应用自己的token
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user_status', data.status);

                console.log('外部token登录成功');

                // 清除URL参数，跳转到应用首页
                const url = new URL(window.location);
                url.searchParams.delete('token');
                url.searchParams.delete('token_type');
                window.location.href = url.pathname + url.hash;

            } else {
                console.log('外部token登录失败:', data.message);
                // 跳转到正常登录页面
                window.location.href = '/login';
            }

        } catch (error) {
            console.error('外部token登录出错:', error);
            // 跳转到正常登录页面
            window.location.href = '/login';
        }
    }
}

// 在页面加载时调用
document.addEventListener('DOMContentLoaded', handleExternalLogin);
```

### 2. 后端需要添加的新接口

在应用的后端添加 `/auth/login-with-external-token` 接口：

```python
@app.post("/auth/login-with-external-token")
async def login_with_external_token(request: ExternalTokenRequest):
    try:
        # 验证外部token的有效性
        # 这里需要调用预发布页面的API或数据库验证token

        # 示例：调用预发布页面的验证接口
        prelaunch_response = await httpx.post(
            "http://localhost:8000/auth/verify-external-token",
            json={
                "token": request.external_token,
                "source": "app_page"
            }
        )

        if prelaunch_response.status_code == 200:
            external_data = prelaunch_response.json()

            # 为用户生成应用自己的token
            app_token = create_app_token(external_data["user_id"])

            return {
                "access_token": app_token,
                "status": external_data["status"],
                "message": "外部token登录成功"
            }
        else:
            raise HTTPException(status_code=401, detail="外部token无效")

    except Exception as e:
        raise HTTPException(status_code=401, detail="外部token验证失败")
```

### 3. 或者简化方案：直接使用外部token

如果两个系统共享数据库或认证服务，可以直接信任外部token：

```javascript
// 简化版本：直接使用外部token
async function handleExternalLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    const externalToken = urlParams.get('token');

    if (externalToken) {
        try {
            // 先验证外部token是否有效
            const response = await fetch('/auth/verify-external-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: externalToken
                })
            });

            if (response.ok) {
                // 直接使用外部token作为应用的token
                localStorage.setItem('token', externalToken);
                localStorage.setItem('user_status', 'active'); // 或从验证接口获取

                console.log('外部token验证成功，直接登录');

                // 清除URL参数并跳转
                const url = new URL(window.location);
                url.searchParams.delete('token');
                url.searchParams.delete('token_type');
                window.location.href = url.pathname + url.hash;
            } else {
                console.log('外部token无效');
                window.location.href = '/login';
            }

        } catch (error) {
            console.error('外部token验证出错:', error);
            window.location.href = '/login';
        }
    }
}
```

## 测试流程

1. 用户在预发布页面登录成功
2. 跳转到 `http://43.139.19.144:3003/?token=xxx&token_type=bearer`
3. 应用页面检测到URL参数，自动调用登录接口
4. 登录成功后清除URL参数，跳转到应用首页
5. 用户完成自动登录，无需手动操作

## 推荐方案

使用方案1（添加专门的外部token接口），这样更安全，也更符合微服务架构的设计理念。
