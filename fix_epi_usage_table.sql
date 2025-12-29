/* Create EPI Usage History Table if it doesn't exist */

CREATE TABLE IF NOT EXISTS public.epi_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "teamMemberId" UUID REFERENCES public.team_members(id) ON DELETE CASCADE,
    "epiId" UUID REFERENCES public.inventory_epis(id) ON DELETE SET NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

/* Allow RLS */
ALTER TABLE public.epi_usage ENABLE ROW LEVEL SECURITY;

/* Policies */
CREATE POLICY "Users can view their own EPI usage logs" 
ON public.epi_usage FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own EPI usage logs" 
ON public.epi_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own EPI usage logs" 
ON public.epi_usage FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own EPI usage logs" 
ON public.epi_usage FOR DELETE 
USING (auth.uid() = user_id);

/* Refresh schema cache */
NOTIFY pgrst, 'reload schema';
