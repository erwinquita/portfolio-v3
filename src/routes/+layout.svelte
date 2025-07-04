<script>
  import { page } from '$app/stores';
  import '../app.css';
  
  let { children } = $props();
</script>

<div class="container">
  <header class="header">
    <nav>
      <ul class="nav">
        <li><a href="/" aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Home</a></li>
        <li><a href="/portfolio" aria-current={$page.url.pathname === '/portfolio' ? 'page' : undefined}>Portfolio</a></li>
        <li><a href="/admin" aria-current={$page.url.pathname.startsWith('/admin') ? 'page' : undefined}>Admin</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    {@render children()}
  </main>
</div>
