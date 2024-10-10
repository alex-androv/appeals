<template>
    <div v-if="show" @click.self="close" class="modal">
      <div class="modal-content">
        <h2>Заявка</h2>
        <div v-if="error" class="error">{{ error }}</div>
        <form @submit.prevent="saveAppeal" v-if="editedAppeal">
          <div class="form-group">
            <label>№: {{ editedAppeal.number }}</label>
          </div>
          <div class="form-group">
            <label>(от {{ formatDate(editedAppeal.created_at) }})</label>
          </div>
          <!-- <div class="form-group">
            <input id="premise" v-model="premiseSearch" @input="searchPremises" placeholder="Дом">
          </div>
          <div class="form-group">
            <input id="apartment" v-model="apartmentSearch" @input="searchApartments" placeholder="Квартира">
          </div> -->
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
              {{ premise.short_address || premise.full_address }}
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
            :disabled="!editedAppeal.premise_id"
          >
          <div v-if="isApartmentDropdownOpen" class="dropdown-menu">
            <div 
              v-for="apartment in apartments" 
              :key="apartment.id"
              @mousedown="selectApartment(apartment)"
              class="dropdown-item"
            >
              <!-- {{ apartment.object_type }} {{ apartment.number }} -->
              {{ formatApartmentDisplay(apartment) }}
            </div>
          </div>
        </div>
      </div>

      
          <div class="form-group">
            <input id="lastName" v-model="editedAppeal.applicant.last_name" required placeholder="Фамилия">
          </div>
          <div class="form-group">
            <input id="firstName" v-model="editedAppeal.applicant.first_name" required placeholder="Имя">
          </div>
          <div class="form-group">
            <input id="patronymic" v-model="editedAppeal.applicant.patronymic_name" placeholder="Отчество">
          </div>
          <div class="form-group">
            <input id="phone" v-model="editedAppeal.applicant.username" required placeholder="Телефон">
          </div>
          <div class="form-group">
            <textarea id="description" v-model="editedAppeal.description" required placeholder="Описание заявки"></textarea>
          </div>
          <div class="form-group">
            <input id="dueDate" type="datetime-local" v-model="editedAppeal.due_date" required>
          </div>
          <div class="form-group">
            <label>Статус заявки: {{ editedAppeal.status.name }}</label>
          </div>
          <div class="form-actions">
            <button class="save-button" type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import debounce from 'lodash/debounce'
  
  export default {
    name: 'EditAppealModal',
    props: {
      show: Boolean,
      appeal: Object
    },
    data() {
      return {
        editedAppeal: null,
        premises: [],
        apartments: [],
        premiseSearch: '',
        apartmentSearch: '',
        error: null,
        isPremiseDropdownOpen: false,
        isApartmentDropdownOpen: false,
      }
    },
    watch: {
      appeal: {
        handler(newAppeal) {
          if (newAppeal) {
            this.editedAppeal = JSON.parse(JSON.stringify(newAppeal))
            this.premiseSearch = this.editedAppeal.premise ? this.editedAppeal.premise.name : ''
            this.apartmentSearch = this.editedAppeal.apartment ? this.editedAppeal.apartment.name : ''
            this.searchPremises()
            this.searchApartments()
          }
        },
        immediate: true
      }
    },
    methods: {
      formatDate(dateString) {
        return new Date(dateString).toLocaleString()
      },
      // searchPremises: debounce(async function() {
      //   try {
      //     const response = await this.$axios.get('geo/v2.0/user-premises/', {
      //       params: { search: this.premiseSearch }
      //     })
      //     this.premises = response.data
      //   } catch (error) {
      //     console.error('Error searching premises:', error)
      //   }
      // }, 300),
      // searchApartments: debounce(async function() {
      //   if (!this.editedAppeal.premise_id) return
      //   try {
      //     const response = await this.$axios.get('geo/v1.0/apartments/', {
      //       params: { 
      //         premise_id: this.editedAppeal.premise_id,
      //         search: this.apartmentSearch
      //       }
      //     })
      //     this.apartments = response.data
      //   } catch (error) {
      //     console.error('Error searching apartments:', error)
      //   }
      // }, 300),
      onPremiseChange() {
        this.editedAppeal.apartment_id = null
        this.apartmentSearch = ''
        this.searchApartments()
      },
      async saveAppeal() {
        try {
          await this.$axios.patch(`appeals/v1.0/appeals/${this.editedAppeal.id}/`, this.editedAppeal)
          this.$emit('appeal-updated', this.editedAppeal)
          this.close()
        } catch (error) {
          console.error('Error saving appeal:', error)
          this.error = error.response?.data?.detail || 'Произошла ошибка при редактировании заявки'
        }
      },
      close() {
        this.$emit('close')
        this.editedAppeal = null
        this.error = null
      },
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
      }
    }, 300),

    searchApartments: debounce(async function() {
      if (!this.editedAppeal.premise_id || this.apartmentSearch.length < 2) {
        this.apartments = []
        return
      }
      try {
        const response = await this.$axios.get('geo/v1.0/apartments/', {
          params: { 
            premise_id: this.editedAppeal.premise_id,
            search: this.apartmentSearch
          }
        })
        this.apartments = response.data.results || []
        this.isApartmentDropdownOpen = this.apartments.length > 0
      } catch (error) {
        console.error('Error searching apartments:', error)
      }
    }, 300),

    selectPremise(premise) {
      this.editedAppeal.premise_id = premise.id
      this.editedAppeal.premise = premise
      this.premiseSearch = premise.short_address || premise.full_address
      this.isPremiseDropdownOpen = false
      this.editedAppeal.apartment_id = null
      this.editedAppeal.apartment = null
      this.apartmentSearch = ''
      this.apartments = []
    },

    selectApartment(apartment) {
      this.editedAppeal.apartment_id = apartment.id
      this.editedAppeal.apartment = apartment
      this.apartmentSearch = this.formatApartmentDisplay(apartment)
      this.isApartmentDropdownOpen = false
    },

    formatApartmentDisplay(apartment) {
      if (!apartment) return ''
      const type = apartment.object_type ? `${apartment.object_type} ` : ''
      return `${type}${apartment.number}`
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

    },
    watch: {
      appeal: {
        handler(newAppeal) {
          if (newAppeal) {
            this.editedAppeal = JSON.parse(JSON.stringify(newAppeal))
            this.premiseSearch = this.editedAppeal.premise ? (this.editedAppeal.premise.short_address || this.editedAppeal.premise.full_address) : ''
            this.apartmentSearch = this.editedAppeal.apartment ? this.formatApartmentDisplay(this.editedAppeal.apartment) : ''
          }
        },
        immediate: true
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

.save-button {
  margin-bottom: 20px;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>