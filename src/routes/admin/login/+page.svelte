<!-- src/routes/admin/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<div class="hero bg-base-200 min-h-screen">
  <div class="hero-content flex-col lg:flex-row-reverse">
    <div class="text-center lg:text-left">
      <h1 class="text-5xl font-bold">Login Admin</h1>
    </div>
    <div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
      <div class="card-body">
        
        {#if form?.message}
          <div class="alert alert-error text-xs p-2">
            <span>{form.message}</span>
          </div>
        {/if}

        <form method="POST" use:enhance>
          <fieldset class="fieldset">
            <label class="label" for="username">Username</label>
            <input 
              id="username"
              name="username" 
              type="text" 
              class="input w-full" 
              placeholder="Username" 
              required 
            />
            
            <label class="label" for="password">Password</label>
            <input 
              id="password"
              name="password" 
              type="password" 
              class="input w-full" 
              placeholder="Password" 
              required 
            />
            
            <button type="submit" class="btn btn-neutral mt-4 w-full">Login</button>
          </fieldset>
        </form>

      </div>
    </div>
  </div>
</div>