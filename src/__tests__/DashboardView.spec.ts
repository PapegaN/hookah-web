import { beforeEach, describe, expect, it } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'

import DashboardView from '@/views/DashboardView.vue'

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows project metrics and next tasks', () => {
    const wrapper = mount(DashboardView)

    expect(wrapper.text()).toContain('Архитектурный прогресс')
    expect(wrapper.text()).toContain('Каталог табака')
    expect(wrapper.text()).toContain('Согласовать API-контракт каталога')
  })
})
