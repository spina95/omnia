import{G as I,K as q,Wb as D}from"./chunk-N2NO2H5W.js";import{a as d,b as m}from"./chunk-VOSPIT4N.js";var $=class b{constructor(a){this.supabase=a}async getExpenses(a){let{page:e,pageSize:t,sort:r,order:o,month:s,year:c,categoryId:y,paymentTypeId:_,search:u}=a,l=(e-1)*t,h=l+t-1,n=this.supabase.client.from("expenses").select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,{count:"exact"});if(s){let i=c||new Date().getFullYear(),p=new Date(i,s-1,1),S=new Date(i,s,0),T=`${i}-${String(s).padStart(2,"0")}-01`,w=s===12?1:s+1,v=`${s===12?i+1:i}-${String(w).padStart(2,"0")}-01`;n=n.gte("date",T).lt("date",v)}else if(c){let i=`${c}-01-01`,p=`${c+1}-01-01`;n=n.gte("date",i).lt("date",p)}y&&(n=n.eq("category_id",y)),_&&(n=n.eq("paymentType_id",_)),u&&(n=n.ilike("name",`%${u}%`)),r?r==="expense_categories.name"?n=n.order("date",{ascending:!1}):r==="payment_types.name"?n=n.order("date",{ascending:!1}):n=n.order(r,{ascending:o==="asc"}):n=n.order("date",{ascending:!1}),n=n.range(l,h);let{data:x,count:g,error:f}=await n;if(f)throw f;return{data:x,count:g}}async getCategories(){let{data:a,error:e}=await this.supabase.client.from("expense_categories").select("id, name, color").order("name");if(e)throw e;return a}async getPaymentTypes(){let{data:a,error:e}=await this.supabase.client.from("payment_types").select("id, name, color").order("name");if(e)throw e;return a}async createExpense(a){let e=d({},a);a.payment_type_id!==void 0&&(e.paymentType_id=a.payment_type_id,delete e.payment_type_id);let{data:t,error:r}=await this.supabase.client.from("expenses").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(r)throw r;return t}async updateExpense(a,e){let t=d({},e);e.payment_type_id!==void 0&&(t.paymentType_id=e.payment_type_id,delete t.payment_type_id);let{data:r,error:o}=await this.supabase.client.from("expenses").update(t).eq("id",a).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(o)throw o;return r}async deleteExpense(a){let{error:e}=await this.supabase.client.from("expenses").delete().eq("id",a);if(e)throw e}async getIncomes(a){let{page:e,pageSize:t,sort:r="date",order:o="desc",month:s,year:c,categoryId:y,paymentTypeId:_,search:u}=a,l=(e-1)*t,h=l+t-1,n=this.supabase.client.from("incomes").select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,{count:"exact"});if(s){let i=c||new Date().getFullYear(),p=`${i}-${String(s).padStart(2,"0")}-01`,S=s===12?1:s+1,w=`${s===12?i+1:i}-${String(S).padStart(2,"0")}-01`;n=n.gte("date",p).lt("date",w)}else if(c){let i=`${c}-01-01`,p=`${c+1}-01-01`;n=n.gte("date",i).lt("date",p)}y&&(n=n.eq("category_id",y)),_&&(n=n.eq("paymentType_id",_)),u&&(n=n.ilike("name",`%${u}%`)),n=n.order(r,{ascending:o==="asc"}),n=n.range(l,h);let{data:x,error:g,count:f}=await n;if(g)throw g;return{data:x,count:f}}async createIncome(a){let e=d({},a);a.payment_type_id!==void 0&&(e.paymentType_id=a.payment_type_id,delete e.payment_type_id);let{data:t,error:r}=await this.supabase.client.from("incomes").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(r)throw r;return t}async updateIncome(a,e){let t=d({},e);e.payment_type_id!==void 0&&(t.paymentType_id=e.payment_type_id,delete t.payment_type_id);let{data:r,error:o}=await this.supabase.client.from("incomes").update(t).eq("id",a).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(o)throw o;return r}async deleteIncome(a){let{error:e}=await this.supabase.client.from("incomes").delete().eq("id",a);if(e)throw e}async getIncomeCategories(){let{data:a,error:e}=await this.supabase.client.from("income_categories").select("id, name, color").order("name");if(e)throw e;return a}async getScheduledExpenses(){let{data:a,error:e}=await this.supabase.client.from("scheduled_expenses").select(`
        id,
        name,
        amount,
        date,
        repeat_interval,
        next_run,
        category_id,
        expense_categories ( id, name, color ),
        paymenttype_id,
        payment_types ( id, name, color )
      `).order("created_at",{ascending:!1});if(e)throw e;return a?.map(t=>m(d({},t),{expense_categories:Array.isArray(t.expense_categories)?t.expense_categories[0]||null:t.expense_categories,payment_types:Array.isArray(t.payment_types)?t.payment_types[0]||null:t.payment_types}))}async createScheduledExpense(a){let{data:e,error:t}=await this.supabase.client.from("scheduled_expenses").insert(a).select(`
        id,
        name,
        amount,
        date,
        repeat_interval,
        next_run,
        category_id,
        expense_categories ( id, name, color ),
        paymenttype_id,
        payment_types ( id, name, color )
      `).single();if(t)throw t;return e?m(d({},e),{expense_categories:e.expense_categories?.[0]||null,payment_types:e.payment_types?.[0]||null}):null}async updateScheduledExpense(a,e){let{data:t,error:r}=await this.supabase.client.from("scheduled_expenses").update(e).eq("id",a).select(`
        id,
        name,
        amount,
        date,
        repeat_interval,
        next_run,
        category_id,
        expense_categories ( id, name, color ),
        paymenttype_id,
        payment_types ( id, name, color )
      `).single();if(r)throw r;return t?m(d({},t),{expense_categories:t.expense_categories?.[0]||null,payment_types:t.payment_types?.[0]||null}):null}async deleteScheduledExpense(a){let{error:e}=await this.supabase.client.from("scheduled_expenses").delete().eq("id",a);if(e)throw e}async getBudgets(){let{data:a,error:e}=await this.supabase.client.from("budgets").select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).order("created_at",{ascending:!1});if(e)throw e;return a?.map(t=>m(d({},t),{payment_types:Array.isArray(t.payment_types)?t.payment_types[0]||null:t.payment_types,expense_categories:Array.isArray(t.expense_categories)?t.expense_categories[0]||null:t.expense_categories}))}async createBudget(a){let{data:e,error:t}=await this.supabase.client.from("budgets").insert(a).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(t)throw t;return e?m(d({},e),{payment_types:e.payment_types?.[0]||null,expense_categories:e.expense_categories?.[0]||null}):null}async updateBudget(a,e){let{data:t,error:r}=await this.supabase.client.from("budgets").update(e).eq("id",a).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(r)throw r;return t?m(d({},t),{payment_types:t.payment_types?.[0]||null,expense_categories:t.expense_categories?.[0]||null}):null}async deleteBudget(a){let{error:e}=await this.supabase.client.from("budgets").delete().eq("id",a);if(e)throw e}async getBudgetSpending(a){let{data:e,error:t}=await this.supabase.client.rpc("get_budget_spending",{input_budget_id:a});if(t)throw t;return e}static \u0275fac=function(e){return new(e||b)(q(D))};static \u0275prov=I({token:b,factory:b.\u0275fac,providedIn:"root"})};export{$ as a};
