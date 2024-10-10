<template>
    <div v-if="show" @click.self="close" class="modal">
      <div class="modal-content">
        <h2>Создание заявки</h2>
        <div v-if="error" class="error">{{ error }}</div>
        <form @submit.prevent="createAppeal">
          <div class="form-group">
            <div class="dropdown-autocomplete">
              <input 
                v-model="premiseSearch" 
                @input="searchPremises" 
                @focus="isPremiseDropdownOpen = true"
                @blur="closePremiseDropdown"
                placeholder="Дом"
              >
              <div v-if="isPremiseDropdownOpen" class="dropdown-menu">
                <div 
                  v-for="premise in premises" 
                  :key="premise.id"
                  @mousedown="selectPremise(premise)"
                  class="dropdown-item"
                >
                  {{ premise.name }}
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <div class="dropdown-autocomplete">
              <input 
                v-model="apartmentSearch" 
                @input="searchApartments" 
                @focus="isApartmentDropdownOpen = true"
                @blur="closeApartmentDropdown"
                placeholder="Квартира"
                :disabled="!newAppeal.premise_id"
              >
              <div v-if="isApartmentDropdownOpen" class="dropdown-menu">
                <div 
                  v-for="apartment in apartments" 
                  :key="apartment.id"
                  @mousedown="selectApartment(apartment)"
                  class="dropdown-item"
                >
                  {{ apartment.name }}
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <input id="lastName" v-model="newAppeal.applicant.last_name" required placeholder="Фамилия">
          </div>
          <div class="form-group">
            <input id="firstName" v-model="newAppeal.applicant.first_name" required placeholder="Имя">
          </div>
          <div class="form-group">
            <input id="patronymic" v-model="newAppeal.applicant.patronymic_name" placeholder="Отчество">
          </div>
          <div class="form-group">
            <input id="phone" v-model="newAppeal.applicant.username" required placeholder="Телефон">
          </div>
          <div class="form-group">
            <textarea id="description" v-model="newAppeal.description" required placeholder="Описание заявки"></textarea>
          </div>
          <div class="form-group">
            <input id="dueDate" type="datetime-local" v-model="newAppeal.due_date" required>
          </div>
          <div class="form-actions">
            <button class="create-button" type="submit">Создать</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import debounce from 'lodash/debounce'
  
  export default {
    name: 'CreateAppealModal',
    props: {
      show: Boolean,
    },
    data() {
      return {
        newAppeal: {
          premise_id: '',
          apartment_id: '',
          applicant: {
            first_name: '',
            last_name: '',
            patronymic_name: '',
            username: '',
          },
          description: '',
          due_date: '',
        },
        premises: [],
        apartments: [],
        premiseSearch: '',
        apartmentSearch: '',
        isPremiseDropdownOpen: false,
        isApartmentDropdownOpen: false,
        error: null
      }
    },
    methods: {
      searchPremises: debounce(async function() {
        if (this.premiseSearch.length < 2) {
          this.premises = []
          return
        }
        try {
          const response = await this.$axios.get('geo/v2.0/user-premises/', {
            params: { search: this.premiseSearch }
          })
          this.premises = response.data.results || []
          this.isPremiseDropdownOpen = this.premises.length > 0
        } catch (error) {
          console.error('Error searching premises:', error)
          this.error = 'Failed to load premises. Please try again.'
        }
      }, 300),
      searchApartments: debounce(async function() {
        if (!this.newAppeal.premise_id || this.apartmentSearch.length < 2) {
          this.apartments = []
          return
        }
        try {
          const response = await this.$axios.get('geo/v1.0/apartments/', {
            params: { 
              premise_id: this.newAppeal.premise_id,
              search: this.apartmentSearch
            }
          })
          this.apartments = response.data.results || []
          this.isApartmentDropdownOpen = this.apartments.length > 0
        } catch (error) {
          console.error('Error searching apartments:', error)
          this.error = 'Failed to load apartments. Please try again.'
        }
      }, 300),
      selectPremise(premise) {
        this.newAppeal.premise_id = premise.id
        this.premiseSearch = premise.name
        this.isPremiseDropdownOpen = false
        this.newAppeal.apartment_id = ''
        this.apartmentSearch = ''
        this.apartments = []
      },
      selectApartment(apartment) {
        this.newAppeal.apartment_id = apartment.id
        this.apartmentSearch = apartment.name
        this.isApartmentDropdownOpen = false
      },
      closePremiseDropdown() {
        setTimeout(() => {
          this.isPremiseDropdownOpen = false
        }, 200)
      },
      closeApartmentDropdown() {
        setTimeout(() => {
          this.isApartmentDropdownOpen = false
        }, 200)
      },
      async createAppeal() {
        try {
          await this.$axios.post('appeals/v1.0/appeals/', this.newAppeal)
          this.$emit('appeal-created')
          this.close()
        } catch (error) {
          console.error('Error creating appeal:', error)
          this.error = error.response?.data?.detail || 'Произошла ошибка при создании заявки'
        }
      },
      close() {
        this.$emit('close')
        this.resetForm()
      },
      resetForm() {
        this.newAppeal = {
          premise_id: '',
          apartment_id: '',
          applicant: {
            first_name: '',
            last_name: '',
            patronymic_name: '',
            username: '',
          },
          description: '',
          due_date: '',
        }
        this.premiseSearch = ''
        this.apartmentSearch = ''
        this.premises = []
        this.apartments = []
        this.isPremiseDropdownOpen = false
        this.isApartmentDropdownOpen = false
        this.error = null
      }
    }
  }
  </script>
  
<style lang="scss" scoped>
.modal {
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;

  .modal-content {
    background-color: #fefefe;
    margin: auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
  }
}

.form-group {
  margin-bottom: 15px;
  display: flex;

  label {
    display: block;
    margin-bottom: 5px;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
}

.form-actions {
  text-align: right;

  button {
    margin-left: 10px;
  }
}

.error {
  color: red;
  margin-bottom: 15px;
}

.dropdown-autocomplete {
  position: relative;
  width: 100%;
  display: flex;

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    display: block;
    float: left;
    min-width: 10rem;
    padding: 0.5rem 0;
    margin: 0.125rem 0 0;
    font-size: 1rem;
    color: #212529;
    text-align: left;
    list-style: none;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 0.25rem 1.5rem;
    clear: both;
    font-weight: 400;
    color: #212529;
    text-align: inherit;
    white-space: nowrap;
    background-color: transparent;
    border: 0;
    cursor: pointer;

    &:hover,
    &:focus {
      color: #16181b;
      text-decoration: none;
      background-color: #f8f9fa;
    }
  }
}

.create-button {
  margin-bottom: 20px;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>