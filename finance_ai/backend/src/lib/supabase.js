export class SupabaseClient {
  constructor() {
    this.url = process.env.SUPABASE_URL || '';
    this.anonKey = process.env.SUPABASE_ANON_KEY || '';
  }

  restUrl(table) {
    return `${this.url}/rest/v1/${table}`;
  }

  storageUrl(bucket, path) {
    return `${this.url}/storage/v1/object/${bucket}/${path}`;
  }

  authHeaders(jwt, extraHeaders = {}) {
    return {
      apikey: this.anonKey,
      Authorization: `Bearer ${jwt}`,
      ...extraHeaders,
    };
  }

  async validateToken(token) {
    const response = await fetch(`${this.url}/auth/v1/user`, {
      method: 'GET',
      headers: this.authHeaders(token),
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`auth validation failed: ${body}`);
    }

    const result = JSON.parse(body);
    return { userId: result.id, email: result.email };
  }

  async query(table, queryParams, jwt) {
    const response = await fetch(`${this.restUrl(table)}?${queryParams}`, {
      method: 'GET',
      headers: this.authHeaders(jwt),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`supabase query error ${response.status}: ${body}`);
    }
    return JSON.parse(body);
  }

  async querySingle(table, queryParams, jwt) {
    const response = await fetch(`${this.restUrl(table)}?${queryParams}`, {
      method: 'GET',
      headers: this.authHeaders(jwt, { Accept: 'application/vnd.pgrst.object+json' }),
    });
    const body = await response.text();
    if (response.status === 406) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`supabase query error ${response.status}: ${body}`);
    }
    return JSON.parse(body);
  }

  async count(table, queryParams, jwt) {
    const response = await fetch(`${this.restUrl(table)}?${queryParams}&select=id`, {
      method: 'HEAD',
      headers: this.authHeaders(jwt, { Prefer: 'count=exact' }),
    });
    const contentRange = response.headers.get('content-range') || '';
    const parts = contentRange.split('/');
    if (parts.length === 2) {
      const count = Number.parseInt(parts[1], 10);
      return Number.isFinite(count) ? count : 0;
    }
    return 0;
  }

  async insert(table, data, jwt) {
    const response = await fetch(this.restUrl(table), {
      method: 'POST',
      headers: this.authHeaders(jwt, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(data),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`supabase insert error ${response.status}: ${body}`);
    }
    return JSON.parse(body);
  }

  async update(table, filter, data, jwt) {
    const response = await fetch(`${this.restUrl(table)}?${filter}`, {
      method: 'PATCH',
      headers: this.authHeaders(jwt, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(data),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`supabase update error ${response.status}: ${body}`);
    }
    return JSON.parse(body);
  }

  async delete(table, filter, jwt) {
    const response = await fetch(`${this.restUrl(table)}?${filter}`, {
      method: 'DELETE',
      headers: this.authHeaders(jwt),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`supabase delete error ${response.status}: ${body}`);
    }
  }

  async storageUpload(bucket, path, fileBuffer, contentType, jwt) {
    const response = await fetch(this.storageUrl(bucket, path), {
      method: 'POST',
      headers: this.authHeaders(jwt, {
        'Content-Type': contentType || 'application/octet-stream',
      }),
      body: fileBuffer,
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`storage upload error ${response.status}: ${body}`);
    }
  }

  async storageDownload(bucket, path, jwt) {
    const response = await fetch(this.storageUrl(bucket, path), {
      method: 'GET',
      headers: this.authHeaders(jwt),
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
      throw new Error(`storage download error ${response.status}: ${buffer.toString()}`);
    }
    return { data: buffer, contentType: response.headers.get('content-type') || '' };
  }

  async storageDelete(bucket, paths, jwt) {
    const response = await fetch(`${this.url}/storage/v1/object/${bucket}`, {
      method: 'DELETE',
      headers: this.authHeaders(jwt, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: paths }),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`storage delete error ${response.status}: ${body}`);
    }
  }

  async invokeEdgeFunction(functionName, body, jwt) {
    const response = await fetch(`${this.url}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: this.authHeaders(jwt, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`edge function error ${response.status}: ${responseText}`);
    }
    return JSON.parse(responseText);
  }
}
