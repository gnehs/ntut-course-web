import createApi from '@/utils/api'

export default (context, inject) => {
  const { apiBase, apiUrl } = createApi(context.$config.apiBase)

  inject('apiBase', apiBase)
  inject('api', apiUrl)
}
