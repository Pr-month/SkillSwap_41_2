import filtersSlice from '@/services/slices/filtersSlice';
import { configureStore } from '@reduxjs/toolkit';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { FiltersPanel } from './filtersPanel';

// Используем типы из вашего слайса
type FiltersState = {
  mode: 'all' | 'want-to-learn' | 'can-teach';
  gender: 'other' | 'male' | 'female';
  city: string[];
  skill: string[];
};

type SkillsCategories = Record<string, readonly string[]>;

const createMockStore = (preloadedState?: Partial<FiltersState>) => {
  return configureStore({
    reducer: {
      filters: filtersSlice,
    },
    preloadedState: {
      filters: {
        mode: 'all',
        gender: 'other',
        city: [],
        skill: [],
        ...preloadedState,
      } as FiltersState,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware(),
  });
};

const meta: Meta<typeof FiltersPanel> = {
  title: 'Components/FiltersPanel',
  component: FiltersPanel,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <Provider store={createMockStore({})}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    skillsCategories: {
      control: 'object',
      description: 'Объект с категориями навыков',
    },
    cities: {
      control: 'object',
      description: 'Объект с городами',
    },
  },
};

export default meta;

type Story = StoryObj<typeof FiltersPanel>;

const baseSkills: SkillsCategories = {
  Программирование: ['JavaScript', 'TypeScript'],
  Дизайн: ['UI/UX', 'Графический дизайн'],
};

const baseCities: string[] = ['Москва', 'Санкт-Петербург'];

export const Default: Story = {
  args: {
    skillsCategories: baseSkills,
    cities: baseCities,
  },
};

export const WantToLearnMode: Story = {
  args: {
    skillsCategories: baseSkills,
    cities: baseCities,
  },
  decorators: [
    Story => (
      <Provider store={createMockStore({ mode: 'want-to-learn' })}>
        <Story />
      </Provider>
    ),
  ],
};

export const CanTeachMode: Story = {
  args: {
    skillsCategories: baseSkills,
    cities: baseCities,
  },
  decorators: [
    Story => (
      <Provider store={createMockStore({ mode: 'can-teach' })}>
        <Story />
      </Provider>
    ),
  ],
};

export const WithSkillsSelected: Story = {
  args: {
    skillsCategories: baseSkills,
    cities: baseCities,
  },
  decorators: [
    Story => (
      <Provider
        store={createMockStore({
          skill: ['JavaScript', 'UI/UX'],
        })}
      >
        <Story />
      </Provider>
    ),
  ],
};

export const WithAllFilters: Story = {
  args: {
    skillsCategories: baseSkills,
    cities: baseCities,
  },
  decorators: [
    Story => (
      <Provider
        store={createMockStore({
          mode: 'can-teach',
          gender: 'female',
          city: ['Москва'],
          skill: ['TypeScript'],
        })}
      >
        <Story />
      </Provider>
    ),
  ],
};
