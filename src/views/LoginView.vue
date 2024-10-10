<template>
  <div class="login-container">
    <h2>Авторизация</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <input
          type="text"
          id="username"
          v-model="username"
          required
          placeholder="Логин или Телефон"
        >
      </div>
      <div class="form-group">
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="Пароль"
        >
      </div>
      <button type="submit" :disabled="isLoading">Войти</button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      isLoading: false
    }
  },
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const response = await axios.post('https://dev.moydomonline.ru/api/auth/login/', {
          username: this.username,
          password: this.password
        });
        const { key } = response.data;
        localStorage.setItem('user-token', key);
        axios.defaults.headers.common['Authorization'] = `Token ${key}`;
        this.$router.push('/');
      } catch (error) {
        this.errorMessage = 'Некорректные данные';
        console.error('Login error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  max-width: 300px;
  margin: 200px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;

  .form-group {
    margin-bottom: 15px;
    display: flex;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    width: 100%;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }

  .error-message {
    color: red;
    margin-top: 10px;
  }
}
</style>