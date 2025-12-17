import{a as te}from"./chunk-KZIMV2AR.js";import{Ca as L,F,G as B,Ga as I,Jb as Q,K as Y,Kb as W,Lb as X,Ma as g,Na as p,Oa as u,Pa as U,Q as V,Qb as Z,R as $,S as N,Va as q,Vb as ee,Wa as v,Y as R,Ya as w,eb as T,fb as S,gb as G,ha as j,hb as A,mb as J,nb as K,pa as z,qa as d,ya as H}from"./chunk-ETHNZGBJ.js";import{a as l,b as y}from"./chunk-VOSPIT4N.js";var oe=i=>[i,"border","border-sidebar-border","text-white","text-sm","rounded-md","px-3","py-2","focus:outline-none","focus:ring-2","focus:ring-brand","flex","items-center","justify-between","min-h-[42px]","hover:border-sidebar-border/80","transition-colors","w-full"];function se(i,n){if(i&1&&(p(0,"label",7),S(1),u()),i&2){let e=w();d(),A(" ",e.label," ")}}function ce(i,n){if(i&1){let e=q();p(0,"div",12),v("click",function(){let r=V(e).$implicit,o=w(2);return $(o.selectOption(r))}),p(1,"span"),S(2),u()()}if(i&2){let e=n.$implicit,t=w(2);T("bg-brand",t.selectedValue===e.value),d(2),G(e.label)}}function le(i,n){i&1&&(p(0,"div",13),S(1," No options available "),u())}function de(i,n){if(i&1){let e=q();p(0,"div",8),v("click",function(r){return V(e),$(r.stopPropagation())}),p(1,"div",9),I(2,ce,3,3,"div",10)(3,le,2,0,"div",11),u()()}if(i&2){let e=w();d(2),g("ngForOf",e.options),d(),g("ngIf",e.options.length===0)}}var ne=class i{constructor(n){this.elementRef=n}options=[];placeholder="Select...";label="";bgColor="bg-dark-blue";selectionChange=new R;selectedValue=null;isOpen=!1;onChange=n=>{};onTouched=()=>{};ngOnInit(){}writeValue(n){this.selectedValue=n}registerOnChange(n){this.onChange=n}registerOnTouched(n){this.onTouched=n}selectOption(n){this.selectedValue=n.value,this.isOpen=!1,this.onChange(this.selectedValue),this.onTouched(),this.selectionChange.emit(this.selectedValue)}getSelectedLabel(){return this.selectedValue===null?this.placeholder:this.options.find(e=>e.value===this.selectedValue)?.label||this.placeholder}toggleDropdown(){this.isOpen=!this.isOpen,this.isOpen&&this.onTouched()}onDocumentClick(n){this.isOpen&&!this.elementRef.nativeElement.contains(n.target)&&(this.isOpen=!1)}static \u0275fac=function(e){return new(e||i)(H(j))};static \u0275cmp=L({type:i,selectors:[["app-select"]],hostBindings:function(e,t){e&1&&v("click",function(o){return t.onDocumentClick(o)},z)},inputs:{options:"options",placeholder:"placeholder",label:"label",bgColor:"bgColor"},outputs:{selectionChange:"selectionChange"},features:[J([{provide:te,useExisting:F(()=>i),multi:!0}])],decls:9,vars:12,consts:[[1,"relative","w-full"],["class","block text-sm font-medium text-slate-300 mb-2",4,"ngIf"],[1,"relative"],["type","button",3,"click","ngClass"],["fill","none","viewBox","0 0 24 24","stroke","currentColor","stroke-width","2",1,"h-4","w-4","text-slate-400","flex-shrink-0","ml-2","transition-transform"],["stroke-linecap","round","stroke-linejoin","round","d","M19 9l-7 7-7-7"],["class","absolute z-[99999] w-full mt-1 bg-dark-blue border border-sidebar-border rounded-md shadow-lg max-h-60 overflow-auto",3,"click",4,"ngIf"],[1,"block","text-sm","font-medium","text-slate-300","mb-2"],[1,"absolute","z-[99999]","w-full","mt-1","bg-dark-blue","border","border-sidebar-border","rounded-md","shadow-lg","max-h-60","overflow-auto",3,"click"],[1,"p-1"],["class","flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-brand-hover transition-colors text-sm text-white",3,"bg-brand","click",4,"ngFor","ngForOf"],["class","px-3 py-2 text-sm text-slate-400 text-center",4,"ngIf"],[1,"flex","items-center","px-3","py-2","rounded-md","cursor-pointer","hover:bg-brand-hover","transition-colors","text-sm","text-white",3,"click"],[1,"px-3","py-2","text-sm","text-slate-400","text-center"]],template:function(e,t){e&1&&(p(0,"div",0),I(1,se,2,1,"label",1),p(2,"div",2)(3,"button",3),v("click",function(){return t.toggleDropdown()}),p(4,"span"),S(5),u(),N(),p(6,"svg",4),U(7,"path",5),u()(),I(8,de,4,2,"div",6),u()()),e&2&&(d(),g("ngIf",t.label),d(2),g("ngClass",K(10,oe,t.bgColor)),d(),T("text-slate-400",t.selectedValue===null)("text-white",t.selectedValue!==null),d(),A(" ",t.getSelectedLabel()," "),d(),T("rotate-180",t.isOpen),d(2),g("ngIf",t.isOpen))},dependencies:[Z,Q,W,X],styles:["[_nghost-%COMP%]{display:block}div[_ngcontent-%COMP%]::-webkit-scrollbar{width:6px}div[_ngcontent-%COMP%]::-webkit-scrollbar-track{background:#1a3254;border-radius:3px}div[_ngcontent-%COMP%]::-webkit-scrollbar-thumb{background:#475569;border-radius:3px}div[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover{background:#64748b}"]})};var ae=class i{constructor(n){this.supabase=n}async getExpenses(n){let{page:e,pageSize:t,sort:r,order:o,month:s,year:m,categoryId:b,paymentTypeId:f,search:h}=n,x=(e-1)*t,O=x+t-1,a=this.supabase.client.from("expenses").select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,{count:"exact"});if(s){let c=m||new Date().getFullYear(),_=new Date(c,s-1,1),M=new Date(c,s,0),P=`${c}-${String(s).padStart(2,"0")}-01`,D=s===12?1:s+1,re=`${s===12?c+1:c}-${String(D).padStart(2,"0")}-01`;a=a.gte("date",P).lt("date",re)}else if(m){let c=`${m}-01-01`,_=`${m+1}-01-01`;a=a.gte("date",c).lt("date",_)}b&&(a=a.eq("category_id",b)),f&&(a=a.eq("paymentType_id",f)),h&&(a=a.ilike("name",`%${h}%`)),r?r==="expense_categories.name"?a=a.order("date",{ascending:!1}):r==="payment_types.name"?a=a.order("date",{ascending:!1}):a=a.order(r,{ascending:o==="asc"}):a=a.order("date",{ascending:!1}),a=a.range(x,O);let{data:E,count:C,error:k}=await a;if(k)throw k;return{data:E,count:C}}async getCategories(){let{data:n,error:e}=await this.supabase.client.from("expense_categories").select("id, name, color").order("name");if(e)throw e;return n}async getPaymentTypes(){let{data:n,error:e}=await this.supabase.client.from("payment_types").select("id, name, color").order("name");if(e)throw e;return n}async createExpense(n){let e=l({},n);n.payment_type_id!==void 0&&(e.paymentType_id=n.payment_type_id,delete e.payment_type_id);let{data:t,error:r}=await this.supabase.client.from("expenses").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(r)throw r;return t}async updateExpense(n,e){let t=l({},e);e.payment_type_id!==void 0&&(t.paymentType_id=e.payment_type_id,delete t.payment_type_id);let{data:r,error:o}=await this.supabase.client.from("expenses").update(t).eq("id",n).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(o)throw o;return r}async deleteExpense(n){let{error:e}=await this.supabase.client.from("expenses").delete().eq("id",n);if(e)throw e}async getIncomes(n){let{page:e,pageSize:t,sort:r="date",order:o="desc",month:s,year:m,categoryId:b,paymentTypeId:f,search:h}=n,x=(e-1)*t,O=x+t-1,a=this.supabase.client.from("incomes").select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,{count:"exact"});if(s){let c=m||new Date().getFullYear(),_=`${c}-${String(s).padStart(2,"0")}-01`,M=s===12?1:s+1,D=`${s===12?c+1:c}-${String(M).padStart(2,"0")}-01`;a=a.gte("date",_).lt("date",D)}else if(m){let c=`${m}-01-01`,_=`${m+1}-01-01`;a=a.gte("date",c).lt("date",_)}b&&(a=a.eq("category_id",b)),f&&(a=a.eq("paymentType_id",f)),h&&(a=a.ilike("name",`%${h}%`)),a=a.order(r,{ascending:o==="asc"}),a=a.range(x,O);let{data:E,error:C,count:k}=await a;if(C)throw C;return{data:E,count:k}}async createIncome(n){let e=l({},n);n.payment_type_id!==void 0&&(e.paymentType_id=n.payment_type_id,delete e.payment_type_id);let{data:t,error:r}=await this.supabase.client.from("incomes").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(r)throw r;return t}async updateIncome(n,e){let t=l({},e);e.payment_type_id!==void 0&&(t.paymentType_id=e.payment_type_id,delete t.payment_type_id);let{data:r,error:o}=await this.supabase.client.from("incomes").update(t).eq("id",n).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(o)throw o;return r}async deleteIncome(n){let{error:e}=await this.supabase.client.from("incomes").delete().eq("id",n);if(e)throw e}async getIncomeCategories(){let{data:n,error:e}=await this.supabase.client.from("income_categories").select("id, name, color").order("name");if(e)throw e;return n}async getScheduledExpenses(){let{data:n,error:e}=await this.supabase.client.from("scheduled_expenses").select(`
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
      `).order("created_at",{ascending:!1});if(e)throw e;return n?.map(t=>y(l({},t),{expense_categories:Array.isArray(t.expense_categories)?t.expense_categories[0]||null:t.expense_categories,payment_types:Array.isArray(t.payment_types)?t.payment_types[0]||null:t.payment_types}))}async createScheduledExpense(n){let{data:e,error:t}=await this.supabase.client.from("scheduled_expenses").insert(n).select(`
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
      `).single();if(t)throw t;return e?y(l({},e),{expense_categories:e.expense_categories?.[0]||null,payment_types:e.payment_types?.[0]||null}):null}async updateScheduledExpense(n,e){let{data:t,error:r}=await this.supabase.client.from("scheduled_expenses").update(e).eq("id",n).select(`
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
      `).single();if(r)throw r;return t?y(l({},t),{expense_categories:t.expense_categories?.[0]||null,payment_types:t.payment_types?.[0]||null}):null}async deleteScheduledExpense(n){let{error:e}=await this.supabase.client.from("scheduled_expenses").delete().eq("id",n);if(e)throw e}async getBudgets(){let{data:n,error:e}=await this.supabase.client.from("budgets").select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).order("created_at",{ascending:!1});if(e)throw e;return n?.map(t=>y(l({},t),{payment_types:Array.isArray(t.payment_types)?t.payment_types[0]||null:t.payment_types,expense_categories:Array.isArray(t.expense_categories)?t.expense_categories[0]||null:t.expense_categories}))}async createBudget(n){let{data:e,error:t}=await this.supabase.client.from("budgets").insert(n).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(t)throw t;return e?y(l({},e),{payment_types:e.payment_types?.[0]||null,expense_categories:e.expense_categories?.[0]||null}):null}async updateBudget(n,e){let{data:t,error:r}=await this.supabase.client.from("budgets").update(e).eq("id",n).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(r)throw r;return t?y(l({},t),{payment_types:t.payment_types?.[0]||null,expense_categories:t.expense_categories?.[0]||null}):null}async deleteBudget(n){let{error:e}=await this.supabase.client.from("budgets").delete().eq("id",n);if(e)throw e}async getBudgetSpending(n){let{data:e,error:t}=await this.supabase.client.rpc("get_budget_spending",{input_budget_id:n});if(t)throw t;return e}static \u0275fac=function(e){return new(e||i)(Y(ee))};static \u0275prov=B({token:i,factory:i.\u0275fac,providedIn:"root"})};export{ne as a,ae as b};
