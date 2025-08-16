<template>
  <!-- Login Form -->
  <div :class="['container123', { 'sign-up-mode': isLogin }]">
    <div class="forms-container">
      <div class="signin-signup">
        <form action="#" class="sign-in-form">
          <h2 class="title">登录</h2>
          <div class="input-field">
            <i> <img src="../../../public/user.png" class="w-5" /></i>
            <input v-model="formValue.username" type="text" placeholder="用户名" />
          </div>
          <div class="input-field">
            <i> <img src="../../../public/password.png" class="w-5" /></i>
            <input v-model="formValue.password" type="password" placeholder="密码" />
          </div>
          <n-button class="btn solid text-lg" @click="login" text-color="#ffffff">立即登录</n-button>
          <n-button class="" @click="isLogin = !isLogin" text>没有账号?去注册</n-button>
        </form>
        <form action="#" class="sign-up-form">
          <h2 class="title">注册</h2>
          <div class="input-field">
            <i> <img src="../../../public/user.png" class="w-5" /></i>
            <input v-model="formValue.username" type="text" placeholder="用户名" />
          </div>
          <div class="input-field">
            <i> <img src="../../../public/email.png" class="w-5" /></i>
            <input v-model="formValue.email" type="email" placeholder="邮箱" />
          </div>
          <div class="input-field">
            <i> <img src="../../../public/password.png" class="w-5" /></i>
            <input v-model="formValue.password" type="password" placeholder="密码" />
          </div>

          <n-button class="btn solid text-lg" text-color="#ffffff" @click="register">立即注册</n-button>
          <n-button class="" @click="isLogin = !isLogin" text>已有账号?去登录</n-button>
        </form>
      </div>
    </div>

    <div class="panels-container">
      <div class="panel left-panel">
        <div class="content">
          <img src="../../../public/logo.png" class="w-30" />
          <h1 class="yishuzi text-5xl">灵瞰视界，洞见未来</h1>
          <h3 class="buttomtext">感知地球变化，赋能智慧决策</h3>
        </div>
        <img src="../../../public/plant.png" class="image123" alt="" />
      </div>
      <div class="panel right-panel">
        <div class="content tooltext">
          <h3>智能语义生成｜秒级描述影像内容</h3>
          <h3>目标精准盘点｜楼宇车辆毫厘无遗</h3>
          <h3>厘米级空间定位｜分秒必争的灾害沙盘</h3>
          <h3>地物状态透视｜量化灾损与城市变迁</h3>
          <h3>动态推演决策｜预判趋势+生成最优路径</h3>
        </div>
        <img src="../../../public/plant.png" class="image123" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { LoginData, userRegisterApi } from '@/api/user';
import { useUserStore } from '@/store';
import { Message } from '@/utils/tips';

const router = useRouter();

const userStore = useUserStore();
const isLogin = ref(false);

const formValue = reactive({
  username: userStore.savedLoginForm.savedUsername || '',
  password: userStore.savedLoginForm.savedPassword || '',
  email: null,
});

const loading = ref(false);

const login = async () => {
  if (loading.value) return;
  loading.value = true;
  if (!formValue.username || !formValue.password) {
    Message.error('用户名和密码不能为空');
    loading.value = false;
    return;
  }
  try {
    await userStore.login(formValue as LoginData);
    const { redirect } = router.currentRoute.value.query;
    await userStore.fetchUserInfo();
    Message.success('登录成功');
    if (redirect) {
      await router.push(redirect as string);
      return;
    }
    await router.push({
      name: userStore.user?.is_superuser ? 'admin' : 'conversation',
    });
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};
const register = async () => {
  if (!formValue.username || !formValue.password || !formValue.email) {
    Message.error('用户名、密码和邮箱不能为空');
    return;
  }
  try {
    const res = await userRegisterApi(formValue);
    console.log(res);
    if (res.status === 200) {
      Message.success('注册成功，请登录');
      isLogin.value = false; // 切换到登录界面
    } else {
      Message.error(res.data.message || '注册失败，请稍后再试');
    }
  } catch (error) {
    console.error('注册失败:', error);
  }
};
if (userStore.user) {
  router.push({ name: 'conversation' });
}
</script>

<style scoped>
/* @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800&display=swap'); */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.yishuzi {
  font-family: monospace;
  color: #ffe484;
  background-color: transparent;
  -webkit-text-stroke: 0.2px #0a2a5c;
  text-shadow: rgba(5, 20, 40, 0.6) 4px 4px 2px;
  position: relative;
  margin-top: 15px;
}

.buttomtext {
  font-family: cursive;
  color: #033f51;
  font-weight: 400;
  font-size: 1.5rem;
  margin-top: 8px;
}

.tooltext {
  color: #ffffff;
  font-family: serif;
  font-size: 1.3rem;
}
body,
input {
  font-family: 'Poppins', sans-serif;
}

.container123 {
  position: relative;
  width: 100%;
  background-color: #fff;
  min-height: 100vh;
  overflow: hidden;
}

.forms-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.signin-signup {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: 75%;
  width: 50%;
  transition: 1s 0.7s ease-in-out;
  display: grid;
  grid-template-columns: 1fr;
  z-index: 5;
}

form {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0rem 5rem;
  transition: all 0.2s 0.7s;
  overflow: hidden;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

form.sign-up-form {
  opacity: 0;
  z-index: 1;
}

form.sign-in-form {
  z-index: 2;
}

.title {
  font-size: 2.2rem;
  color: #444;
  margin-bottom: 10px;
}

.input-field {
  max-width: 380px;
  width: 100%;
  background-color: #f0f0f0;
  margin: 10px 0;
  height: 55px;
  border-radius: 55px;
  display: flex; /* 设置父容器为 Flexbox */
  justify-content: space-between; /* 让图标和输入框分开 */
  padding: 0 2rem;
  position: relative;
  align-items: center;
}

.input-field i {
  display: flex; /* 使图标也变为 Flexbox 项 */
  justify-content: center; /* 水平居中图标 */
  align-items: center; /* 垂直居中图标 */
  text-align: center;
  line-height: 55px;
  transition: 0.5s;
  font-size: 1.1rem;
  margin-right: 15px;
}

.input-field input {
  background: none;
  outline: none;
  border: none;
  line-height: 1;
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.input-field input::placeholder {
  color: #636363;
  font-weight: 500;
}

.social-text {
  padding: 0.7rem 0;
  font-size: 1rem;
}

.social-media {
  display: flex;
  justify-content: center;
}

.social-icon {
  height: 46px;
  width: 46px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 0.45rem;
  color: #333;
  border-radius: 50%;
  border: 1px solid #333;
  text-decoration: none;
  font-size: 1.1rem;
  transition: 0.3s;
}

.social-icon:hover {
  color: #4481eb;
  border-color: #4481eb;
}

.btn {
  width: 150px;
  background-color: rgba(70, 195, 179, 0.91);
  border: none;
  outline: none;
  height: 49px;
  border-radius: 49px;
  color: #fff;
  text-transform: uppercase;
  font-weight: 600;
  margin: 10px 0;
  cursor: pointer;
  transition: 0.5s;
}

.btn:hover {
  background-color: #4d84e2;
}
.panels-container {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}

.container123:before {
  content: '';
  position: absolute;
  height: 2000px;
  width: 2000px;
  top: -10%;
  right: 48%;
  transform: translateY(-50%);
  background-image: linear-gradient(-45deg, #63beef 20%, #0bac90 80%);
  transition: 1.8s ease-in-out;
  border-radius: 50%;
  z-index: 6;
}

.image123 {
  width: 100%;
  transition: transform 1.1s ease-in-out;
  transition-delay: 0.4s;
}

.panel {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  text-align: center;
  z-index: 6;
}

.left-panel {
  pointer-events: all;
  padding: 3rem 17% 2rem 12%;
}

.right-panel {
  pointer-events: none;
  padding: 3rem 12% 2rem 17%;
}

.panel .content {
  transition: transform 0.9s ease-in-out;
  transition-delay: 0.6s;
  padding: 1.4rem 0;
}

.panel p {
  font-size: 0.95rem;
  padding: 0.7rem 0;
}
.btn.transparent {
  margin: 0;
  background: none;
  border: 2px solid #fff;
  width: 130px;
  height: 41px;
  font-weight: 600;
  font-size: 0.8rem;
}

.right-panel .image123,
.right-panel .content {
  transform: translate(800px, -400px);
}

/* ANIMATION */

.container123.sign-up-mode:before {
  transform: translate(100%, -50%);
  right: 52%;
}

.container123.sign-up-mode .left-panel .image123,
.container123.sign-up-mode .left-panel .content {
  transform: translateX(-800px);
}

.container123.sign-up-mode .signin-signup {
  left: 25%;
}

.container123.sign-up-mode form.sign-up-form {
  opacity: 1;
  z-index: 2;
}

.container123.sign-up-mode form.sign-in-form {
  opacity: 0;
  z-index: 1;
}

.container123.sign-up-mode .right-panel .image123,
.container123.sign-up-mode .right-panel .content {
  transform: translateX(0%);
}

.container123.sign-up-mode .left-panel {
  pointer-events: none;
}

.container123.sign-up-mode .right-panel {
  pointer-events: all;
}

@media (max-width: 870px) {
  .container123 {
    min-height: 800px;
    height: 100vh;
  }
  .signin-signup {
    width: 100%;
    top: 95%;
    transform: translate(-50%, -100%);
    transition: 1s 0.8s ease-in-out;
  }

  .signin-signup,
  .container123.sign-up-mode .signin-signup {
    left: 50%;
  }

  .panels-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr 1fr;
  }

  .panel {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 2.5rem 8%;
    grid-column: 1 / 2;
  }

  .right-panel {
    grid-row: 3 / 4;
  }

  .left-panel {
    grid-row: 1 / 2;
  }

  .image123 {
    width: 200px;
    transition: transform 0.9s ease-in-out;
    transition-delay: 0.6s;
  }

  .panel .content {
    padding-right: 15%;
    transition: transform 0.9s ease-in-out;
    transition-delay: 0.8s;
  }

  .panel h3 {
    font-size: 1.2rem;
  }

  .panel p {
    font-size: 0.7rem;
    padding: 0.5rem 0;
  }

  .btn.transparent {
    width: 110px;
    height: 35px;
    font-size: 0.7rem;
  }

  .container123:before {
    width: 1500px;
    height: 1500px;
    transform: translateX(-50%);
    left: 30%;
    bottom: 68%;
    right: initial;
    top: initial;
    transition: 2s ease-in-out;
  }

  .container123.sign-up-mode:before {
    transform: translate(-50%, 100%);
    bottom: 32%;
    right: initial;
  }

  .container123.sign-up-mode .left-panel .image123,
  .container123.sign-up-mode .left-panel .content {
    transform: translateY(-300px);
  }

  .container123.sign-up-mode .right-panel .image123,
  .container123.sign-up-mode .right-panel .content {
    transform: translateY(0px);
  }

  .right-panel .image123,
  .right-panel .content {
    transform: translateY(300px);
  }

  .container123.sign-up-mode .signin-signup {
    top: 5%;
    transform: translate(-50%, 0);
  }
}

@media (max-width: 570px) {
  form {
    padding: 0 1.5rem;
  }

  .image123 {
    display: none;
  }
  .panel .content {
    padding: 0.5rem 1rem;
  }
  .container123 {
    padding: 1.5rem;
  }

  .container123:before {
    bottom: 72%;
    left: 50%;
  }

  .container123.sign-up-mode:before {
    bottom: 28%;
    left: 50%;
  }
}
</style>
