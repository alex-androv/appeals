<template>
  <div class="home-view">
    <h1>Список заявок</h1>
    <button @click="openCreateModal" class="create-button">СОЗДАТЬ</button>
    <div class="filters">
      <input v-model="search" @input="debounceSearch" placeholder="Поиск (№ заявки, название)">
      <select v-model="selectedPremise" @change="loadAppeals">
        <option value="">Дом</option>
        <option v-for="premise in premises" :key="premise.id" :value="premise.id">
          {{ premise.short_address || premise.full_address }}
        </option>
      </select>
    </div>

    <p v-if="loading">Загрузка...</p>

    <p v-if="error" class="error">{{ error }}</p>

    <table v-if="!loading && !error && appeals.length">
      <thead>
        <tr>
          <th>№</th>
          <th>Создана</th>
          <th>Адрес</th>
          <th>Заявитель</th>
          <th>Описание</th>
          <th>Срок</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="appeal in appeals" :key="appeal.id">
          <td>
            <a href="#" @click.prevent="openEditModal(appeal)">
              {{ appeal.number || 'N/A' }}
            </a>
          </td>
          <td>{{ formatDate(appeal.created_at) }}</td>
          <td>{{ formatAddress(appeal) }}</td>
          <td>{{ formatApplicant(appeal.applicant) }}</td>
          <td>{{ appeal.description || 'N/A' }}</td>
          <td>{{ formatDate(appeal.due_date) }}</td>
          <td>{{ formatStatus(appeal.status) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading && !error && appeals.length === 0">Заявок не найдено</p>

    <div class="pagination" v-if="!loading && !error && totalPages > 1">
      <button @click="changePage(-1)" :disabled="currentPage === 1">Предыдущая</button>
      <span>Страница {{ currentPage }} из {{ totalPages }}</span>
      <button @click="changePage(1)" :disabled="currentPage === totalPages">Следующая</button>
      <select v-model="pageSize" @change="loadAppeals">
        <option :value="10">показывать по 10</option>
        <option :value="20">показывать по 20</option>
        <option :value="50">показывать по 50</option>
      </select>
    </div>

    <edit-appeal-modal
      :show="showEditModal"
      :appeal="selectedAppeal"
      @close="closeEditModal"
      @appeal-updated="onAppealUpdated"
    />

    <create-appeal-modal
      :show="showCreateModal"
      @close="closeCreateModal"
      @appeal-created="onAppealCreated"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import debounce from 'lodash/debounce'
import EditAppealModal from '@/components/EditAppealModal.vue'
import CreateAppealModal from '@/components/CreateAppealModal.vue'

export default {
  name: 'HomeView',
  components: {
    EditAppealModal,
    CreateAppealModal
  },
  data() {
    return {
      search: '',
      selectedPremise: '',
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      premises: [],
      loading: false,
      error: null,
      showEditModal: false,
      showCreateModal: false,
      selectedAppeal: null
    }
  },
  computed: {
    ...mapState(['appeals'])
  },
  methods: {
    ...mapActions(['setAppeals']),
    async loadAppeals() {
      this.loading = true
      this.error = null
      try {
        const response = await this.$axios.get('appeals/v1.0/appeals/', {
          params: {
            search: this.search,
            premise_id: this.selectedPremise,
            page: this.currentPage,
            page_size: this.pageSize
          }
        })
        this.setAppeals(Array.isArray(response.data.results) ? response.data.results : [])
        this.totalPages = Math.ceil((response.data.count || 0) / this.pageSize)
      } catch (error) {
        console.error('Error loading appeals:', error)
        this.error = 'Ошибка загрузки'
        if (error.response && error.response.status === 403) {
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },
    async loadPremises() {
      this.loading = true
      this.error = null
      try {
        const response = await this.$axios.get('geo/v2.0/user-premises/')
        this.premises = Array.isArray(response.data.results) ? response.data.results : []
      } catch (error) {
        console.error('Error loading premises:', error)
        this.error = 'Ошибка загрузки'
        if (error.response && error.response.status === 403) {
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },
    changePage(delta) {
      this.currentPage += delta
      this.loadAppeals()
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString()
    },
    formatAddress(appeal) {
      if (!appeal || !appeal.premise || !appeal.apartment) return 'N/A';
      
      let address = appeal.premise.short_address || appeal.premise.full_address || '';
      
      if (appeal.apartment) {
        if (address) address += ', ';
        address += `${appeal.apartment.object_type} ${appeal.apartment.number}`;
      }
      
      return address || 'N/A';
    },
    formatApplicant(applicant) {
      if (!applicant || typeof applicant !== 'object') return 'N/A'
      if (typeof applicant === 'string') {
        try {
          applicant = JSON.parse(applicant)
        } catch (e) {
          return applicant || 'N/A'
        }
      }
      return `${applicant.last_name || ''} ${applicant.first_name || ''} ${applicant.patronymic_name || ''}`.trim() || applicant.username || 'N/A'
    },
    formatStatus(status) {
      if (!status) return 'N/A'
      if (typeof status === 'string') {
        try {
          status = JSON.parse(status)
        } catch (e) {
          return status
        }
      }
      return status.name || 'N/A'
    },
    debounceSearch: debounce(function() {
      this.currentPage = 1
      this.loadAppeals()
    }, 300),
    openEditModal(appeal) {
      this.selectedAppeal = JSON.parse(JSON.stringify(appeal))
      this.showEditModal = true
    },
    closeEditModal() {
      this.showEditModal = false
      this.selectedAppeal = null
    },
    onAppealUpdated(updatedAppeal) {
      const index = this.appeals.findIndex(appeal => appeal.id === updatedAppeal.id)
      if (index !== -1) {
        this.$set(this.appeals, index, updatedAppeal)
      }
      this.closeEditModal()
      this.loadAppeals() 
    },
    openCreateModal() {
      this.showCreateModal = true
    },
    closeCreateModal() {
      this.showCreateModal = false
    },
    onAppealCreated() {
      this.loadAppeals()
    }
  },
  created() {
    this.loadPremises().then(() => this.loadAppeals())
  },
  watch: {
    pageSize() {
      this.currentPage = 1
      this.loadAppeals()
    }
  }
}
</script>

<style lang="scss" scoped>
.home-view {
  padding: 20px;

  .create-button {
    margin-bottom: 20px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .filters {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;

    input,
    select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 200px;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;

    th,
    td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }

    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
  }

  button {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:disabled {
      background-color: #ddd;
      cursor: not-allowed;
    }
  }

  select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .error {
    color: red;
    font-weight: bold;
  }
}
</style>