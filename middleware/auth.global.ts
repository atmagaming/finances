export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();
  const adminPaths = ["/admin"];
  if (!loggedIn.value && adminPaths.some((p) => to.path.startsWith(p))) return navigateTo("/login");
});
