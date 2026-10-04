import type { Directive } from 'vue'

interface RippleElement extends HTMLElement {
  _rippleCleanup?: () => void
}

export const vRipple: Directive<RippleElement> = {
  mounted(el: RippleElement) {
    const handlePointerDown = (event: PointerEvent) => {
      // Ignore right clicks or disabled elements
      if (event.button !== 0 || el.hasAttribute('disabled') || el.classList.contains('disabled')) {
        return
      }

      const rect = el.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = event.clientX - rect.left - size / 2
      const y = event.clientY - rect.top - size / 2

      const ripple = document.createElement('span')
      ripple.className = 'md-ripple-wave'
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`

      el.appendChild(ripple)

      const removeRipple = () => {
        ripple.style.opacity = '0'
        setTimeout(() => {
          if (ripple.parentNode === el) {
            el.removeChild(ripple)
          }
        }, 400)
        window.removeEventListener('pointerup', removeRipple)
        window.removeEventListener('pointercancel', removeRipple)
      }

      window.addEventListener('pointerup', removeRipple, { once: true })
      window.addEventListener('pointercancel', removeRipple, { once: true })
    }

    el.addEventListener('pointerdown', handlePointerDown)
    el._rippleCleanup = () => {
      el.removeEventListener('pointerdown', handlePointerDown)
    }
  },
  unmounted(el: RippleElement) {
    if (el._rippleCleanup) {
      el._rippleCleanup()
    }
  }
}
