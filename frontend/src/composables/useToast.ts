import { ref } from 'vue'

const toastMessage = ref('')
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function showToast(msg: string, duration = 2800) {
    toastMessage.value = msg
    toastVisible.value = true

    if (toastTimer) {
      clearTimeout(toastTimer)
    }

    toastTimer = setTimeout(() => {
      toastVisible.value = false
    }, duration)
  }

  return {
    toastMessage,
    toastVisible,
    showToast
  }
}
