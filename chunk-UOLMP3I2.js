import{G as I,K as q,hc as E}from"./chunk-XVI4XSAG.js";import{a as c,b as _}from"./chunk-VOSPIT4N.js";var D=class S{constructor(t){this.supabase=t}async getExpenses(t){let{page:e,pageSize:a,sort:n,order:s,month:i,year:p,categoryId:m,paymentTypeId:l,tagIds:u,search:f}=t,b=(e-1)*a,o=b+a-1,r=this.supabase.client.from("expenses").select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color ),
        expense_tag_mappings ( expense_tags ( id, name, color ) )
      `,{count:"exact"});if(i){let d=p||new Date().getFullYear(),g=new Date(d,i-1,1),w=new Date(d,i,0),$=`${d}-${String(i).padStart(2,"0")}-01`,v=i===12?1:i+1,A=`${i===12?d+1:d}-${String(v).padStart(2,"0")}-01`;r=r.gte("date",$).lt("date",A)}else if(p){let d=`${p}-01-01`,g=`${p+1}-01-01`;r=r.gte("date",d).lt("date",g)}if(m&&(r=r.eq("category_id",m)),l&&(r=r.eq("paymentType_id",l)),u&&u.length>0){let{data:d}=await this.supabase.client.from("expense_tag_mappings").select("expense_id").in("tag_id",u);if(d&&d.length>0){let g=[...new Set(d.map(w=>w.expense_id))];r=r.in("id",g)}else r=r.eq("id",-1)}f&&(r=r.ilike("name",`%${f}%`)),n?n==="expense_categories.name"?r=r.order("date",{ascending:!1}):n==="payment_types.name"?r=r.order("date",{ascending:!1}):r=r.order(n,{ascending:s==="asc"}):r=r.order("date",{ascending:!1}),r=r.range(b,o);let{data:h,count:T,error:y}=await r;if(y)throw y;return{data:h?.map(d=>_(c({},d),{expense_tags:d.expense_tag_mappings?.map(g=>g.expense_tags).filter(Boolean)||[]})),count:T}}async getCategories(){let{data:t,error:e}=await this.supabase.client.from("expense_categories").select("id, name, color, description").order("name");if(e)throw e;return t}async getPaymentTypes(){let{data:t,error:e}=await this.supabase.client.from("payment_types").select("id, name, color").order("name");if(e)throw e;return t}async createExpense(t){let e=c({},t);t.payment_type_id!==void 0&&(e.paymentType_id=t.payment_type_id,delete e.payment_type_id),delete e.tag_ids;let{data:a,error:n}=await this.supabase.client.from("expenses").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(n)throw n;if(t.tag_ids&&t.tag_ids.length>0){let s=t.tag_ids.map(p=>({expense_id:a.id,tag_id:p})),{error:i}=await this.supabase.client.from("expense_tag_mappings").insert(s);if(i)throw i}return a}async updateExpense(t,e){let a=c({},e);e.payment_type_id!==void 0&&(a.paymentType_id=e.payment_type_id,delete a.payment_type_id),delete a.tag_ids;let{data:n,error:s}=await this.supabase.client.from("expenses").update(a).eq("id",t).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(s)throw s;if(e.tag_ids!==void 0){let{error:i}=await this.supabase.client.from("expense_tag_mappings").delete().eq("expense_id",t);if(i)throw i;if(e.tag_ids.length>0){let p=e.tag_ids.map(l=>({expense_id:t,tag_id:l})),{error:m}=await this.supabase.client.from("expense_tag_mappings").insert(p);if(m)throw m}}return n}async deleteExpense(t){let{error:e}=await this.supabase.client.from("expenses").delete().eq("id",t);if(e)throw e}generateRandomColor(){let t=["#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#14b8a6","#06b6d4","#0ea5e9","#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e"];return t[Math.floor(Math.random()*t.length)]}async getTags(){let{data:t,error:e}=await this.supabase.client.from("expense_tags").select("id, name, color").order("name");if(e)throw e;return t}async createTag(t,e){let a=e||this.generateRandomColor(),{data:n,error:s}=await this.supabase.client.from("expense_tags").insert({name:t,color:a}).select("id, name, color").single();if(s)throw s;return n}async updateTag(t,e,a){let{data:n,error:s}=await this.supabase.client.from("expense_tags").update({name:e,color:a}).eq("id",t).select("id, name, color").single();if(s)throw s;return n}async deleteTag(t){let{error:e}=await this.supabase.client.from("expense_tags").delete().eq("id",t);if(e)throw e}async getIncomes(t){let{page:e,pageSize:a,sort:n="date",order:s="desc",month:i,year:p,categoryId:m,paymentTypeId:l,search:u}=t,f=(e-1)*a,b=f+a-1,o=this.supabase.client.from("incomes").select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,{count:"exact"});if(i){let y=p||new Date().getFullYear(),x=`${y}-${String(i).padStart(2,"0")}-01`,d=i===12?1:i+1,w=`${i===12?y+1:y}-${String(d).padStart(2,"0")}-01`;o=o.gte("date",x).lt("date",w)}else if(p){let y=`${p}-01-01`,x=`${p+1}-01-01`;o=o.gte("date",y).lt("date",x)}m&&(o=o.eq("category_id",m)),l&&(o=o.eq("paymentType_id",l)),u&&(o=o.ilike("name",`%${u}%`)),o=o.order(n,{ascending:s==="asc"}),o=o.range(f,b);let{data:r,error:h,count:T}=await o;if(h)throw h;return{data:r,count:T}}async createIncome(t){let e=c({},t);t.payment_type_id!==void 0&&(e.paymentType_id=t.payment_type_id,delete e.payment_type_id);let{data:a,error:n}=await this.supabase.client.from("incomes").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(n)throw n;return a}async updateIncome(t,e){let a=c({},e);e.payment_type_id!==void 0&&(a.paymentType_id=e.payment_type_id,delete a.payment_type_id);let{data:n,error:s}=await this.supabase.client.from("incomes").update(a).eq("id",t).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(s)throw s;return n}async deleteIncome(t){let{error:e}=await this.supabase.client.from("incomes").delete().eq("id",t);if(e)throw e}async getIncomeCategories(){let{data:t,error:e}=await this.supabase.client.from("income_categories").select("id, name, color").order("name");if(e)throw e;return t}async getScheduledExpenses(){let{data:t,error:e}=await this.supabase.client.from("scheduled_expenses").select(`
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
      `).order("created_at",{ascending:!1});if(e)throw e;return t?.map(a=>_(c({},a),{expense_categories:Array.isArray(a.expense_categories)?a.expense_categories[0]||null:a.expense_categories,payment_types:Array.isArray(a.payment_types)?a.payment_types[0]||null:a.payment_types}))}async createScheduledExpense(t){let{data:e,error:a}=await this.supabase.client.from("scheduled_expenses").insert(t).select(`
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
      `).single();if(a)throw a;return e?_(c({},e),{expense_categories:e.expense_categories?.[0]||null,payment_types:e.payment_types?.[0]||null}):null}async updateScheduledExpense(t,e){let{data:a,error:n}=await this.supabase.client.from("scheduled_expenses").update(e).eq("id",t).select(`
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
      `).single();if(n)throw n;return a?_(c({},a),{expense_categories:a.expense_categories?.[0]||null,payment_types:a.payment_types?.[0]||null}):null}async deleteScheduledExpense(t){let{error:e}=await this.supabase.client.from("scheduled_expenses").delete().eq("id",t);if(e)throw e}async getBudgets(){let{data:t,error:e}=await this.supabase.client.from("budgets").select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).order("created_at",{ascending:!1});if(e)throw e;return t?.map(a=>_(c({},a),{payment_types:Array.isArray(a.payment_types)?a.payment_types[0]||null:a.payment_types,expense_categories:Array.isArray(a.expense_categories)?a.expense_categories[0]||null:a.expense_categories}))}async createBudget(t){let{data:e,error:a}=await this.supabase.client.from("budgets").insert(t).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(a)throw a;return e?_(c({},e),{payment_types:e.payment_types?.[0]||null,expense_categories:e.expense_categories?.[0]||null}):null}async updateBudget(t,e){let{data:a,error:n}=await this.supabase.client.from("budgets").update(e).eq("id",t).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(n)throw n;return a?_(c({},a),{payment_types:a.payment_types?.[0]||null,expense_categories:a.expense_categories?.[0]||null}):null}async deleteBudget(t){let{error:e}=await this.supabase.client.from("budgets").delete().eq("id",t);if(e)throw e}async getBudgetSpending(t){let{data:e,error:a}=await this.supabase.client.rpc("get_budget_spending",{input_budget_id:t});if(a)throw a;return e}static \u0275fac=function(e){return new(e||S)(q(E))};static \u0275prov=I({token:S,factory:S.\u0275fac,providedIn:"root"})};export{D as a};
