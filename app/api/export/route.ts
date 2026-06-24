import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSession } from '@/utils/auth';
import { convertToCSV, convertToJSON, getExportFilename, type ExportFormat } from '@/lib/export';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'appointments', 'customers', 'services'
    const format = (searchParams.get('format') as ExportFormat) || 'csv';

    if (!type) {
      return NextResponse.json({ success: false, error: 'Missing export type' }, { status: 400 });
    }

    const supabase = await createClient();
    let data: any[] = [];
    let exportType = 'data';

    switch (type) {
      case 'appointments':
        const { data: appts } = await supabase
          .from('appointments')
          .select('*, customers(full_name), users(username)')
          .order('start_time', { ascending: false });
        
        // Flatten relations for CSV
        data = (appts || []).map(a => ({
          ...a,
          customer_name: a.customers?.full_name || 'N/A',
          staff_name: a.users?.username || 'N/A',
          customers: undefined,
          users: undefined
        }));
        exportType = 'appointments';
        break;

      case 'customers':
        const { data: custs } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
        data = custs || [];
        exportType = 'customers';
        break;

      case 'services':
        const { data: svcs } = await supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true });
        data = svcs || [];
        exportType = 'services';
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid export type' }, { status: 400 });
    }

    const content = format === 'json' 
      ? convertToJSON(data) 
      : convertToCSV(data);

    const filename = getExportFilename(exportType, format);
    const contentType = format === 'json' ? 'application/json' : 'text/csv; charset=utf-8';

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('[API EXPORT ERROR]:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
