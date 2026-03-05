import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { getProfile, updateMe } from "@/api/profile";
import { useAuth } from "@/contexts/AuthContext";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import type { Profile, User } from "@/types";

export function useMe() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: getMe,
    select: (res): User => res.data,
    enabled: isAuthenticated,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: getProfile,
    select: (res): Profile => res.data,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      first_name?: string;
      last_name?: string;
      email?: string;
    }) => updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.me });
    },
  });
}
