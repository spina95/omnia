import{a as te}from"./chunk-6CP6HOOG.js";import{Ba as L,Cb as Q,Db as W,Eb as X,F as B,Fa as I,G as A,Gb as Z,K as Y,La as g,Lb as ee,Ma as d,Na as u,Oa as U,Q as D,R as $,S as N,Sa as q,Ta as x,Ua as v,Y as R,ab as T,bb as w,cb as G,db as M,ga as j,ib as J,jb as K,oa as z,pa as l,xa as H}from"./chunk-D4XNNWLR.js";import{a as m,b as k}from"./chunk-VOSPIT4N.js";var oe=i=>[i,"border","border-sidebar-border","text-white","text-sm","rounded-md","px-3","py-2","focus:outline-none","focus:ring-2","focus:ring-brand","flex","items-center","justify-between","min-h-[42px]","hover:border-sidebar-border/80","transition-colors","w-full"];function se(i,t){if(i&1&&(d(0,"label",7),w(1),u()),i&2){let e=v();l(),M(" ",e.label," ")}}function ce(i,t){if(i&1){let e=q();d(0,"div",12),x("click",function(){let r=D(e).$implicit,o=v(2);return $(o.selectOption(r))}),d(1,"span"),w(2),u()()}if(i&2){let e=t.$implicit,n=v(2);T("bg-brand",n.selectedValue===e.value),l(2),G(e.label)}}function le(i,t){i&1&&(d(0,"div",13),w(1," No options available "),u())}function de(i,t){if(i&1){let e=q();d(0,"div",8),x("click",function(r){return D(e),$(r.stopPropagation())}),d(1,"div",9),I(2,ce,3,3,"div",10)(3,le,2,0,"div",11),u()()}if(i&2){let e=v();l(2),g("ngForOf",e.options),l(),g("ngIf",e.options.length===0)}}var ne=class i{constructor(t){this.elementRef=t}options=[];placeholder="Select...";label="";bgColor="bg-dark-blue";selectionChange=new R;selectedValue=null;isOpen=!1;onChange=t=>{};onTouched=()=>{};ngOnInit(){}writeValue(t){this.selectedValue=t}registerOnChange(t){this.onChange=t}registerOnTouched(t){this.onTouched=t}selectOption(t){this.selectedValue=t.value,this.isOpen=!1,this.onChange(this.selectedValue),this.onTouched(),this.selectionChange.emit(this.selectedValue)}getSelectedLabel(){return this.selectedValue===null?this.placeholder:this.options.find(e=>e.value===this.selectedValue)?.label||this.placeholder}toggleDropdown(){this.isOpen=!this.isOpen,this.isOpen&&this.onTouched()}onDocumentClick(t){this.isOpen&&!this.elementRef.nativeElement.contains(t.target)&&(this.isOpen=!1)}static \u0275fac=function(e){return new(e||i)(H(j))};static \u0275cmp=L({type:i,selectors:[["app-select"]],hostBindings:function(e,n){e&1&&x("click",function(o){return n.onDocumentClick(o)},z)},inputs:{options:"options",placeholder:"placeholder",label:"label",bgColor:"bgColor"},outputs:{selectionChange:"selectionChange"},features:[J([{provide:te,useExisting:B(()=>i),multi:!0}])],decls:9,vars:12,consts:[[1,"relative","w-full"],["class","block text-sm font-medium text-slate-300 mb-2",4,"ngIf"],[1,"relative"],["type","button",3,"click","ngClass"],["fill","none","viewBox","0 0 24 24","stroke","currentColor","stroke-width","2",1,"h-4","w-4","text-slate-400","flex-shrink-0","ml-2","transition-transform"],["stroke-linecap","round","stroke-linejoin","round","d","M19 9l-7 7-7-7"],["class","absolute z-50 w-full mt-1 bg-dark-blue border border-sidebar-border rounded-md shadow-lg max-h-60 overflow-auto",3,"click",4,"ngIf"],[1,"block","text-sm","font-medium","text-slate-300","mb-2"],[1,"absolute","z-50","w-full","mt-1","bg-dark-blue","border","border-sidebar-border","rounded-md","shadow-lg","max-h-60","overflow-auto",3,"click"],[1,"p-1"],["class","flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-brand-hover transition-colors text-sm text-white",3,"bg-brand","click",4,"ngFor","ngForOf"],["class","px-3 py-2 text-sm text-slate-400 text-center",4,"ngIf"],[1,"flex","items-center","px-3","py-2","rounded-md","cursor-pointer","hover:bg-brand-hover","transition-colors","text-sm","text-white",3,"click"],[1,"px-3","py-2","text-sm","text-slate-400","text-center"]],template:function(e,n){e&1&&(d(0,"div",0),I(1,se,2,1,"label",1),d(2,"div",2)(3,"button",3),x("click",function(){return n.toggleDropdown()}),d(4,"span"),w(5),u(),N(),d(6,"svg",4),U(7,"path",5),u()(),I(8,de,4,2,"div",6),u()()),e&2&&(l(),g("ngIf",n.label),l(2),g("ngClass",K(10,oe,n.bgColor)),l(),T("text-slate-400",n.selectedValue===null)("text-white",n.selectedValue!==null),l(),M(" ",n.getSelectedLabel()," "),l(),T("rotate-180",n.isOpen),l(2),g("ngIf",n.isOpen))},dependencies:[Z,Q,W,X],styles:["[_nghost-%COMP%]{display:block}div[_ngcontent-%COMP%]::-webkit-scrollbar{width:6px}div[_ngcontent-%COMP%]::-webkit-scrollbar-track{background:#1a3254;border-radius:3px}div[_ngcontent-%COMP%]::-webkit-scrollbar-thumb{background:#475569;border-radius:3px}div[_ngcontent-%COMP%]::-webkit-scrollbar-thumb:hover{background:#64748b}"]})};var ae=class i{constructor(t){this.supabase=t}async getExpenses(t){let{page:e,pageSize:n,sort:r,order:o,month:s,year:p,categoryId:_,paymentTypeId:b,search:f}=t,h=(e-1)*n,O=h+n-1,a=this.supabase.client.from("expenses").select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,{count:"exact"});if(s){let c=p||new Date().getFullYear(),y=new Date(c,s-1,1),P=new Date(c,s,0),F=`${c}-${String(s).padStart(2,"0")}-01`,V=s===12?1:s+1,re=`${s===12?c+1:c}-${String(V).padStart(2,"0")}-01`;a=a.gte("date",F).lt("date",re)}else if(p){let c=`${p}-01-01`,y=`${p+1}-01-01`;a=a.gte("date",c).lt("date",y)}_&&(a=a.eq("category_id",_)),b&&(a=a.eq("paymentType_id",b)),f&&(a=a.ilike("name",`%${f}%`)),r?r==="expense_categories.name"?a=a.order("date",{ascending:!1}):r==="payment_types.name"?a=a.order("date",{ascending:!1}):a=a.order(r,{ascending:o==="asc"}):a=a.order("date",{ascending:!1}),a=a.range(h,O);let{data:E,count:S,error:C}=await a;if(C)throw C;return{data:E,count:S}}async getCategories(){let{data:t,error:e}=await this.supabase.client.from("expense_categories").select("id, name, color").order("name");if(e)throw e;return t}async getPaymentTypes(){let{data:t,error:e}=await this.supabase.client.from("payment_types").select("id, name, color").order("name");if(e)throw e;return t}async createExpense(t){let e=m({},t);t.payment_type_id!==void 0&&(e.paymentType_id=t.payment_type_id,delete e.payment_type_id);let{data:n,error:r}=await this.supabase.client.from("expenses").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(r)throw r;return n}async updateExpense(t,e){let n=m({},e);e.payment_type_id!==void 0&&(n.paymentType_id=e.payment_type_id,delete n.payment_type_id);let{data:r,error:o}=await this.supabase.client.from("expenses").update(n).eq("id",t).select(`
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(o)throw o;return r}async deleteExpense(t){let{error:e}=await this.supabase.client.from("expenses").delete().eq("id",t);if(e)throw e}async getIncomes(t){let{page:e,pageSize:n,sort:r="date",order:o="desc",month:s,year:p,categoryId:_,paymentTypeId:b,search:f}=t,h=(e-1)*n,O=h+n-1,a=this.supabase.client.from("incomes").select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,{count:"exact"});if(s){let c=p||new Date().getFullYear(),y=`${c}-${String(s).padStart(2,"0")}-01`,P=s===12?1:s+1,V=`${s===12?c+1:c}-${String(P).padStart(2,"0")}-01`;a=a.gte("date",y).lt("date",V)}else if(p){let c=`${p}-01-01`,y=`${p+1}-01-01`;a=a.gte("date",c).lt("date",y)}_&&(a=a.eq("category_id",_)),b&&(a=a.eq("paymentType_id",b)),f&&(a=a.ilike("name",`%${f}%`)),a=a.order(r,{ascending:o==="asc"}),a=a.range(h,O);let{data:E,error:S,count:C}=await a;if(S)throw S;return{data:E,count:C}}async createIncome(t){let e=m({},t);t.payment_type_id!==void 0&&(e.paymentType_id=t.payment_type_id,delete e.payment_type_id);let{data:n,error:r}=await this.supabase.client.from("incomes").insert(e).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(r)throw r;return n}async updateIncome(t,e){let n=m({},e);e.payment_type_id!==void 0&&(n.paymentType_id=e.payment_type_id,delete n.payment_type_id);let{data:r,error:o}=await this.supabase.client.from("incomes").update(n).eq("id",t).select(`
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `).single();if(o)throw o;return r}async deleteIncome(t){let{error:e}=await this.supabase.client.from("incomes").delete().eq("id",t);if(e)throw e}async getIncomeCategories(){let{data:t,error:e}=await this.supabase.client.from("income_categories").select("id, name, color").order("name");if(e)throw e;return t}async getBudgets(){let{data:t,error:e}=await this.supabase.client.from("budgets").select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).order("created_at",{ascending:!1});if(e)throw e;return t?.map(n=>k(m({},n),{payment_types:Array.isArray(n.payment_types)?n.payment_types[0]||null:n.payment_types,expense_categories:Array.isArray(n.expense_categories)?n.expense_categories[0]||null:n.expense_categories}))}async createBudget(t){let{data:e,error:n}=await this.supabase.client.from("budgets").insert(t).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(n)throw n;return e?k(m({},e),{payment_types:e.payment_types?.[0]||null,expense_categories:e.expense_categories?.[0]||null}):null}async updateBudget(t,e){let{data:n,error:r}=await this.supabase.client.from("budgets").update(e).eq("id",t).select(`
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `).single();if(r)throw r;return n?k(m({},n),{payment_types:n.payment_types?.[0]||null,expense_categories:n.expense_categories?.[0]||null}):null}async deleteBudget(t){let{error:e}=await this.supabase.client.from("budgets").delete().eq("id",t);if(e)throw e}async getBudgetSpending(t){let{data:e,error:n}=await this.supabase.client.rpc("get_budget_spending",{input_budget_id:t});if(n)throw n;return e}static \u0275fac=function(e){return new(e||i)(Y(ee))};static \u0275prov=A({token:i,factory:i.\u0275fac,providedIn:"root"})};export{ne as a,ae as b};
