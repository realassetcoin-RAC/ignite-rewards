-- Apply Cities Lookup with 10K Chunks (10,000 records each)
-- This script applies the 33 10K chunk files to populate the cities_lookup table

-- Step 1: Clear existing data
TRUNCATE TABLE cities_lookup CASCADE;

-- Step 2: Apply 10K Chunks 1-10
\i apply_cities_10k_chunk_1.sql
\i apply_cities_10k_chunk_2.sql
\i apply_cities_10k_chunk_3.sql
\i apply_cities_10k_chunk_4.sql
\i apply_cities_10k_chunk_5.sql
\i apply_cities_10k_chunk_6.sql
\i apply_cities_10k_chunk_7.sql
\i apply_cities_10k_chunk_8.sql
\i apply_cities_10k_chunk_9.sql
\i apply_cities_10k_chunk_10.sql

-- Step 3: Apply 10K Chunks 11-20
\i apply_cities_10k_chunk_11.sql
\i apply_cities_10k_chunk_12.sql
\i apply_cities_10k_chunk_13.sql
\i apply_cities_10k_chunk_14.sql
\i apply_cities_10k_chunk_15.sql
\i apply_cities_10k_chunk_16.sql
\i apply_cities_10k_chunk_17.sql
\i apply_cities_10k_chunk_18.sql
\i apply_cities_10k_chunk_19.sql
\i apply_cities_10k_chunk_20.sql

-- Step 4: Apply 10K Chunks 21-30
\i apply_cities_10k_chunk_21.sql
\i apply_cities_10k_chunk_22.sql
\i apply_cities_10k_chunk_23.sql
\i apply_cities_10k_chunk_24.sql
\i apply_cities_10k_chunk_25.sql
\i apply_cities_10k_chunk_26.sql
\i apply_cities_10k_chunk_27.sql
\i apply_cities_10k_chunk_28.sql
\i apply_cities_10k_chunk_29.sql
\i apply_cities_10k_chunk_30.sql

-- Step 5: Apply 10K Chunks 31-33
\i apply_cities_10k_chunk_31.sql
\i apply_cities_10k_chunk_32.sql
\i apply_cities_10k_chunk_33.sql

-- Step 6: Verify the data
\i verify_cities_data_10k.sql
