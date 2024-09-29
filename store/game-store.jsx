import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { LocalStorage } from '@/lib/client'
import apiActions from '@/app/actions/client/secure'
import Axios from '@/app/actions/axios'
import { NotificationManager } from '@/components/NotificationBar/NotificationBar'
import bs58 from 'bs58'
let tasks = []
const saveToLocalStorage = async (key, value) => {
  await LocalStorage.set(key, value)
}
class Task {
  constructor(type, uid, stateOnMount) {
    this.uid = uid
    this.type = type
    this.stateOnMount = stateOnMount
  }
}

async function createRecursion(
  responseObjectKey,
  valueToResolve,
  handler,
  args,
  currentDepth = 0,
  maxDepth = 10,
  baseTimeout = 1000,
  timeIncreaseScale = 1.5,
) {
  if (currentDepth > maxDepth) {
    const error = new Error(`Exceeded max recursion depth of ${maxDepth}`)
    NotificationManager.append({
      type: 'error',
      message: error.message,
      title: 'Error',
      vibrate: false,
      sound: false,
    })

    throw error
  }
  // exponential backoff
  const timeout = baseTimeout * Math.pow(timeIncreaseScale, currentDepth)
  /* 
      milliseconds

      depth 1: 1500
      depth 2: 2250
      depth 3: 3375
      depth 4: 5062.5
      depth 5: 7593.75
      depth 6: 11390.625
      depth 7: 17085.9375
      depth 8: 25628.90625
      depth 9: 38443.359375
      depth 10: 57665.0390625
      depth 11: timeout
    */
  await new Promise(resolve => setTimeout(resolve, timeout))

  const response = await handler(...args)

  if (response[responseObjectKey] == valueToResolve) {
    return response
  } else {
    return createRecursion(
      responseObjectKey,
      valueToResolve,
      handler,
      args,
      currentDepth + 1,
      maxDepth,
      baseTimeout,
      timeIncreaseScale,
    )
  }
}

const useBalance = (set, get) => ({
  balance: Number(LocalStorage.get('balance')) || 0,

  getBalance: () => get().balance,

  setBalance: balance => {
    saveToLocalStorage('balance', balance)
    set({ balance })
  },

  addBalance: async amount => {
    const { getBalance, setBalance } = get()
    if (getBalance() + amount < 0) {
      throw new Error('Cannot add negative balance')
    }

    const newBalance = Number((getBalance() + amount).toFixed(0))
    setBalance(newBalance)
  },

  synchronizeBalance: async () => {
    const { xApiKey, setBalance } = get()

    const response = await apiActions.balance(xApiKey)

    saveToLocalStorage('balance', response.Balance)

    setBalance(response.Balance)
    return response
  },
})
const useLevels = (set, get) => ({
  levels: LocalStorage.get('levels') || [],

  getLevels: () => get().levels,

  setLevels: levels => set({ levels }),

  synchronizeLevels: async () => {
    const { xApiKey, setLevels } = get()
    const response = await apiActions.levels(xApiKey)

    saveToLocalStorage('levels', response)

    setLevels(response)
    return response
  },
})
const useInventory = (set, get) => ({
  inventory: LocalStorage.get('inventory') || [],

  getInventory: () => get().inventory,

  setInventory: inventory => {
    saveToLocalStorage('inventory', inventory)
    set({ inventory })
  },

  addSharkEnergy: async sharkType => {
    const { getInventory, setInventory } = get()
    const inventory = getInventory()
    const sharkIndex = inventory.findIndex(s => s.Shark === sharkType)

    const updatedSharks = [...inventory]
    const currentShark = updatedSharks[sharkIndex]

    const newEnergy = currentShark.Energy + 1

    updatedSharks[sharkIndex] = {
      ...currentShark,
      Energy: newEnergy,
    }

    setInventory(updatedSharks)
  },
  removeSharkEnergy: async (sharkType, amount) => {
    const { getInventory, setInventory } = get()
    const inventory = getInventory()
    const sharkIndex = inventory.findIndex(s => s.Shark === sharkType)

    if (sharkIndex === -1) {
      return
    }

    const updatedSharks = [...inventory]
    const currentShark = updatedSharks[sharkIndex]

    const newEnergy = Math.max(0, currentShark.Energy - amount)

    updatedSharks[sharkIndex] = {
      ...currentShark,
      Energy: newEnergy,
    }

    saveToLocalStorage('inventory', updatedSharks)

    setInventory(updatedSharks)
  },

  synchronizeInventory: async () => {
    const { xApiKey, setInventory } = get()

    const response = await apiActions.inventory(xApiKey)

    setInventory(response)
    return response
  },
})
const useProfile = (set, get) => ({
  profile: LocalStorage.get('profile') || {},

  getProfile: () => get().profile,

  setProfile: profile => set({ profile }), // profile is immutable

  synchronizeProfile: async () => {
    const { xApiKey, setProfile } = get()

    const response = await apiActions.profile(xApiKey)

    saveToLocalStorage('profile', response)

    setProfile(response)
    return response
  },
})
const useSharks = (set, get) => ({
  sharks: LocalStorage.get('sharks') || [],

  getSharks: () => get().sharks,

  setSharks: sharks => set({ sharks }),

  synchronizeSharks: async () => {
    const { xApiKey, setSharks } = get()

    const response = await apiActions.sharks(xApiKey)

    saveToLocalStorage('sharks', response)

    setSharks(response)
    return response
  },
})
const useSkills = (set, get) => ({
  skills: LocalStorage.get('skills') || [],

  setSkills: skills => {
    saveToLocalStorage('skills', skills)

    set({ skills })
  },
  removeSkillEnergy: async (skillType, amount) => {
    const { skills, setSkills } = get()

    const skillIndex = skills.findIndex(s => s.Skill === skillType)

    if (skillIndex === -1) {
      return
    }

    const updatedSkills = [...skills]
    updatedSkills[skillIndex] = {
      ...updatedSkills[skillIndex],
      Energy: Math.max(0, updatedSkills[skillIndex].Energy - amount),
    }

    saveToLocalStorage('skills', updatedSkills)

    setSkills(updatedSkills)
  },
  addSkillEnergy: async skillType => {
    const { skills, setSkills } = get()
    const skillIndex = skills.findIndex(s => s.Skill === skillType)

    const newEnergy = skills[skillIndex].Energy + 1
    const updatedSkills = [...skills]
    updatedSkills[skillIndex] = {
      ...updatedSkills[skillIndex],
      Energy: newEnergy,
    }

    setSkills(updatedSkills)
  },

  synchronizeSkills: async () => {
    const { xApiKey, setSkills } = get()

    const response = await apiActions.skills(xApiKey)

    setSkills(response)
    return response
  },
})
const useFriends = (set, get) => ({
  friends: LocalStorage.get('friends') || [],

  getFriends: () => get().friends,

  setFriends: friends => set({ friends }),

  synchronizeFriends: async () => {
    const { xApiKey, setFriends } = get()

    const response = await apiActions.friends(xApiKey)

    saveToLocalStorage('friends', response)

    setFriends(response)
    return response
  },
})
const useEnergy = (set, get) => ({
  energy: LocalStorage.get('energy') || {},

  getEnergy: () => get().energy,

  setEnergy: energy => set({ energy }),

  synchronizeEnergy: async () => {
    const { xApiKey, setEnergy } = get()

    const response = await apiActions.energy(xApiKey)

    saveToLocalStorage('energy', response)

    setEnergy(response)
    return response
  },
})
const useVisits = (set, get) => ({
  visits: LocalStorage.get('visits') || {},

  getVisits: () => get().visits,

  setVisits: visits => set({ visits }),

  synchronizeVisits: async () => {
    const { xApiKey, setVisits } = get()
    const response = await apiActions.visit(xApiKey)

    saveToLocalStorage('visits', response)

    setVisits(response)
    return response
  },
})
const useTopPlayers = (set, get) => ({
  topPlayers: LocalStorage.get('topPlayers') || [],

  getTopPlayers: () => get().topPlayers,

  setTopPlayers: topPlayers => set({ topPlayers }),

  synchronizeTopPlayers: async () => {
    const { xApiKey, setTopPlayers } = get()

    const response = await apiActions.top(xApiKey)

    saveToLocalStorage('topPlayers', response)

    setTopPlayers(response)
    return response
  },
})

export const useGameStore = create(
  devtools((set, get) => ({
    ...useTopPlayers(set, get),
    ...useVisits(set, get),
    ...useProfile(set, get),
    ...useBalance(set, get),
    ...useLevels(set, get),
    ...useInventory(set, get),
    ...useSharks(set, get),
    ...useSkills(set, get),
    ...useFriends(set, get),
    ...useEnergy(set, get),

    tasks: [],

    internalHandlers: {
      createTimeoutOnEnergyRecharge: async (
        timeMs,
        amount,
        { sharkType = null, skillType = null },
      ) => {
        const { addSharkEnergy, addSkillEnergy } = get()
        setTimeout(() => {
          if (sharkType) {
            addSharkEnergy(sharkType, amount)
          }
          if (skillType) {
            addSkillEnergy(skillType, amount)
          }
        }, timeMs)
      },
      createProfile: async (first_name, last_name, user_name) => {
        const { xApiKey } = get()

        const response = await apiActions.createUser(xApiKey, { first_name, last_name, user_name })

        return response
      },
      createClaim: async skill => {
        const {
          xApiKey,
          internalHandlers,
          miscHandlers,
          removeSharkEnergy,
          balance,
          addBalance,
          removeSkillEnergy,
        } = get()

        const sharkType = miscHandlers.getSharkTypeBySkillType(skill)
        const income = miscHandlers.getSkillIncomeByType(skill)
        const energyCost = miscHandlers.getSkillEnergyCostByType(skill)
        const sharkEnergy = miscHandlers.getSharkCurrentEnergyByType(sharkType)
        if (sharkEnergy < energyCost) {
          return
        }

        addBalance(income)
        removeSkillEnergy(skill, energyCost)
        removeSharkEnergy(sharkType, energyCost)
        const response = await apiActions.createClaim(xApiKey, { shark: sharkType, skill })

        if (response.CODE === 200) {
          const task = new Task('claim', response.Uuid, {
            balance,
          })
          tasks.push(task)
        } else {
          internalHandlers.addBalance(-income)

          NotificationManager.append({
            type: 'error',
            message: 'Cannot use this skill',
            title: 'Error',
            vibrate: true,
            sound: false,
          })
        }
        return response
      },
      shopEnergy: async shark => {
        const { xApiKey } = get()

        const response = await apiActions.shopEnergy(xApiKey, { shark })

        return response
      },
      shopShark: async shark => {
        const {
          xApiKey,
          internalHandlers,
          miscHandlers,
          balance,

          inventory,
          sharks,
          addBalance,
          skills,
        } = get()
        const sharkPrice = miscHandlers.getSharkPriceByType(shark)

        addBalance(-sharkPrice)
        miscHandlers.buyShark(shark)
        const response = await apiActions.shopShark(xApiKey, { shark })

        if (response.CODE === 200) {
          const task = new Task('shopShark', response.Uuid, { skills, inventory, sharks, balance })
          tasks.push(task)
        } else {
          NotificationManager.append({
            type: 'error',
            message: 'Cannot buy this shark',
            title: 'Error',
            vibrate: true,
            sound: false,
          })
        }

        return response
      },
      shopSkill: async skill => {
        const { xApiKey, miscHandlers, internalHandlers, balance, addBalance } = get()

        const shark = miscHandlers.getSharkTypeBySkillType(skill)
        const skillPrice = miscHandlers.getSkillLevelUpPriceByType(skill)

        if (skillPrice === 'MAX') {
          return
        }

        if (balance < skillPrice) {
          return
        }

        addBalance(-skillPrice)
        miscHandlers.upSkillLevel(skill)

        const response = await apiActions.shopSkill(xApiKey, { shark, skill })

        if (response.CODE === 200) {
          const task = new Task('shopSkill', response.Uuid, {
            balance: get().balance,
            skills: get().skills,
          })
          tasks.push(task)

          NotificationManager.append({
            type: 'success',
            message: `Successfully upgraded ${skill} skill`,
            title: 'Success',
            vibrate: true,
            sound: false,
          })
        } else {
          internalHandlers.addBalance(skillPrice)
          miscHandlers.upSkillLevel(skill, -1)

          NotificationManager.append({
            type: 'error',
            message: 'Failed to upgrade skill',
            title: 'Error',
            vibrate: true,
            sound: false,
          })
        }

        return response
      },
      shopEnergyReserveForShark: async sharkType => {
        const { xApiKey, miscHandlers, getBalance, getInventory, addSharkEnergy, addBalance } =
          get()

        const balance = getBalance()
        const inventory = getInventory()

        const maxEnergyReserve = miscHandlers.getMaxEnergyReserveForShark(sharkType)
        const price = miscHandlers.getSharkBuyEnergyReservePriceByType(sharkType)
        const currentEnergyReserve = miscHandlers.getSharkMaxEnergyByType(sharkType)

        if (currentEnergyReserve >= maxEnergyReserve) {
          NotificationManager.append({
            type: 'error',
            message: 'Energy reserve is already at maximum for current level',
            title: 'Error',
            vibrate: true,
            sound: false,
          })
          return
        }

        if (balance < price) {
          NotificationManager.append({
            type: 'error',
            message: 'Insufficient balance to upgrade energy reserve',
            title: 'Error',
            vibrate: true,
            sound: false,
          })
          return
        }
        addSharkEnergy(sharkType)
        addBalance(-price)
        miscHandlers.addEnergyReserveForShark(sharkType)

        const response = await apiActions.shopEnergy(xApiKey, { shark: sharkType })

        if (response.CODE === 200) {
          const task = new Task('shopEnergyReserve', response.Uuid, {
            balance,
            inventory,
          })
          tasks.push(task)

          NotificationManager.append({
            type: 'success',
            message: `Successfully upgraded energy reserve for ${sharkType}`,
            title: 'Success',
            vibrate: true,
            sound: false,
          })
        } else {
          addBalance(price)
          miscHandlers.addEnergyReserveForShark(sharkType, -1)

          NotificationManager.append({
            type: 'error',
            message: 'Failed to upgrade energy reserve',
            title: 'Error',
            vibrate: true,
            sound: false,
          })
        }

        return response
      },
    },
    miscHandlers: {
      getMaxEnergyReserveForShark() {
        const { getLevels, getProfile } = get()
        const currentLevel = getProfile().Level

        const maxLevel = getLevels().find(l => l.level === currentLevel)
        return maxLevel.energy
      },
      getUserSkillLevelByType(skillType) {
        const { skills } = get()

        const findedSkill = skills.find(s => s.Skill === skillType)

        return findedSkill?.Level || 0
      },
      getSharkTypeBySkillType(skillType) {
        const { getSharks } = get()

        const findedShark = getSharks().find(s => s.skills.find(s => s.type === skillType))

        return findedShark?.type
      },
      getSkillIncomeByType(skillType) {
        const { getSharks } = get()
        const { miscHandlers } = get()
        const skillLevel = miscHandlers.getUserSkillLevelByType(skillType)
        for (const shark of getSharks()) {
          for (const skill of shark.skills) {
            if (skill.type === skillType) {
              for (const level of skill.levels) {
                if (level.level === skillLevel) {
                  return Number(level.income)
                }
              }
            }
          }
        }
      },
      getSkillCurrentEnergyByType(skillType) {
        const { skills } = get()

        for (const skill of skills) {
          if (skill.Skill === skillType) {
            return Number(skill?.Energy)
          }
        }
      },
      getSkillEnergyCostByType(skillType) {
        const { getSharks } = get()
        const { miscHandlers } = get()
        const skillLevel = miscHandlers.getUserSkillLevelByType(skillType)
        for (const shark of getSharks()) {
          for (const skill of shark.skills) {
            if (skill.type === skillType) {
              for (const level of skill.levels) {
                if (level.level === skillLevel) {
                  return Number(level.energyCost)
                }
              }
            }
          }
        }
      },
      getSkillLevelUpPriceByType(skillType) {
        const { getSharks } = get()

        const { miscHandlers } = get()
        const skillLevel = miscHandlers.getUserSkillLevelByType(skillType)
        for (const shark of getSharks()) {
          for (const skill of shark.skills) {
            if (skill.type === skillType) {
              const nextLevel = skill.levels[skillLevel + 1]

              if (!nextLevel) {
                return 'MAX'
              }
              return Number(nextLevel.price)
            }
          }
        }
      },
      getSharkCurrentEnergyByType(sharkType) {
        const { inventory } = get()
        for (const shark of inventory) {
          if (shark.Shark === sharkType) {
            return Number(shark?.Energy)
          }
        }
      },
      getSharkMaxEnergyByType(sharkType) {
        const { inventory } = get()

        for (const shark of inventory || []) {
          if (shark.Shark === sharkType) {
            return Number(shark?.EnergyReserve)
          }
        }
      },
      getSharkBuyEnergyReservePriceByType(sharkType) {
        const { getSharks } = get()
        for (const shark of getSharks()) {
          if (shark.type === sharkType) {
            return Number(shark?.energyPrice)
          }
        }
      },
      getSharkPriceByType(sharkType) {
        const { getSharks } = get()

        for (const shark of getSharks()) {
          if (shark.type === sharkType) {
            return Number(shark?.price)
          }
        }
      },
      isSharkLocked(sharkType) {
        const { getInventory } = get()

        for (const shark of getInventory()) {
          if (shark.Shark === sharkType) {
            return false
          }
        }
        return true
      },
      buyShark: async sharkType => {
        const { setInventory, setSkills, skills, sharks, inventory } = get()

        if (inventory.findIndex(s => s.Shark === sharkType) === -1) {
          const sharkIndex = sharks.find(s => s.type === sharkType)

          const newShark = {
            Shark: sharkType,
            Energy: sharkIndex.energy,
            EnergyReserve: sharkIndex.energy,
          }
          const newSkills = sharkIndex.skills.map(skill => {
            return {
              Shark: sharkType,
              Skill: skill.type,
              Level: 0,
              Energy: skill.levels[0].energy,
              EnergyReserve: skill.levels[0].energy,
            }
          })

          const updatedSharks = [...inventory]
          updatedSharks.push(newShark)

          const updatedSkills = [...skills]
          updatedSkills.push(...newSkills)

          setInventory(updatedSharks)
          setSkills(updatedSkills)
        }
      },
      addEnergyReserveForShark: async sharkType => {
        const { getInventory, setInventory } = get()

        const inventory = getInventory()
        const sharkIndex = inventory.findIndex(s => s.Shark === sharkType)

        const newEnergy = inventory[sharkIndex].EnergyReserve + 1

        inventory[sharkIndex] = {
          ...inventory[sharkIndex],
          EnergyReserve: newEnergy,
        }

        saveToLocalStorage('inventory', inventory)

        setInventory(inventory)
      },
      upSkillLevel: async skillType => {
        const { skills, setSkills } = get()
        const skillIndex = skills.findIndex(s => s.Skill === skillType)

        const updatedSkills = [...skills]

        updatedSkills[skillIndex] = {
          ...updatedSkills[skillIndex],
          Level: updatedSkills[skillIndex].Level + 1,
        }

        saveToLocalStorage('skills', updatedSkills)

        setSkills(updatedSkills)
      },
    },
    sync: async () => {
      const {
        synchronizeBalance,
        synchronizeLevels,
        synchronizeInventory,
        synchronizeProfile,
        synchronizeSharks,
        synchronizeSkills,
        synchronizeFriends,
        synchronizeEnergy,
        synchronizeVisits,
        synchronizeTopPlayers,
      } = get()

      createRecursion('CODE', 200, synchronizeEnergy, [])
      createRecursion('CODE', 200, synchronizeProfile, [])
      createRecursion('CODE', 200, synchronizeBalance, [])
      createRecursion('CODE', 200, synchronizeLevels, [])
      createRecursion('CODE', 200, synchronizeInventory, [])
      createRecursion('CODE', 200, synchronizeSharks, [])
      createRecursion('CODE', 200, synchronizeSkills, [])
      createRecursion('CODE', 200, synchronizeFriends, [])
      createRecursion('CODE', 200, synchronizeVisits, [])
      createRecursion('CODE', 200, synchronizeTopPlayers, [])
    },
    processSocketMessage: async message => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const messageData = message.data.toString()

      const splittedMessageData = messageData.split(':')
      if (splittedMessageData.length < 3) {
        return
      }

      const messageType = splittedMessageData[0]
      const messageUuid = splittedMessageData[1]
      const messageStatus = splittedMessageData[2]

      const task = tasks.find(t => t.uid === messageUuid)
      if (task) {
        tasks = tasks.filter(t => t.uid !== task.uid)

        if (messageStatus !== 'ok') {
          const errorMessage = splittedMessageData[3]

          NotificationManager.append({
            type: 'warn',
            message: errorMessage,
            title: 'warning',
            vibrate: true,
            sound: false,
          })

          set({
            ...task.stateOnMount,
          })
        }
      } else {
        tasks = []
        if (messageType === 'charge') {
          const { addSharkEnergy, addSkillEnergy } = get()
          if (messageUuid === 'shark') {
            addSharkEnergy(messageStatus)
          }
          if (messageUuid === 'skill') {
            addSkillEnergy(messageStatus)
          }
        }
      }
    },
    initWebSocket: () => {
      const { xApiKey, processSocketMessage } = get()

      const wssUrl = Axios.wssUrl(window.location.host)

      wssUrl.searchParams.append('auth', `${bs58.encode(Buffer.from(xApiKey))}`)

      const socket = new WebSocket(wssUrl)

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'HELLO', data: 'auth' }))
      }

      socket.onclose = e => {
        setTimeout(() => get().initWebSocket(), 5000)
      }

      socket.onmessage = processSocketMessage

      socket.onerror = e => {
        setTimeout(() => get().initWebSocket(), 5000)
      }

      set({ socket })
    },
    initApp: async (telegram, doFullySync = true) => {
      const { synchronizeProfile, sync } = get()

      const xApiKey = telegram.initData

      set({ TELEGRAM: telegram, xApiKey: xApiKey })

      const initiatedApp = get()
      initiatedApp.initWebSocket()

      const profile = await synchronizeProfile(xApiKey)

      if (profile.CODE === 404) {
        const createdProfile = await createRecursion(
          'CODE',
          200,
          initiatedApp.internalHandlers.createProfile,
          [
            telegram.initDataUnsafe.user.first_name,
            telegram.initDataUnsafe.user.first_name,
            telegram.initDataUnsafe.user.first_name,
          ],
        )

        if (createdProfile.CODE === 200) {
          await createRecursion('create_status', 'created', synchronizeProfile, [])
        }
      }

      if (doFullySync) {
        sync()
      }

      return get()
    },
  })),
)
