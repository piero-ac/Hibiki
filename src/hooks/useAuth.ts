import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { account } from '@/lib/appwrite'
import { ID } from 'appwrite'

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => account.get(),
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      account.createEmailPasswordSession({
        email,
        password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string
      password: string
      name: string
    }) => {
      await account.create({ userId: ID.unique(), email, password, name })
      await account.createEmailPasswordSession({ email, password })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => account.deleteSession({ sessionId: 'current' }),
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
    },
  })
}
