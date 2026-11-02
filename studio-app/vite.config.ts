import { defineConfig } from 'vite';
export default defineConfig({base:'./',build:{outDir:'../studio',emptyOutDir:true},server:{fs:{allow:['..']}}});
