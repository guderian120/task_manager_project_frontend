<template>
  <div ref="swaggerContainer"></div>
</template>

<script>
import { ref, onMounted } from 'vue'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default {
  setup() {
    const swaggerContainer = ref(null)
    
    onMounted(() => {
      SwaggerUI({
        url: '/api-definition.json',
        domNode: swaggerContainer.value
      })
    })

    return { swaggerContainer }
  }
}
</script>