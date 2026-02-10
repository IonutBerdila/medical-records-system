namespace MedicalRecords.Application.Admin;

public class AdminDashboardResponse
{
    public AdminDashboardCounts Counts { get; set; } = new();
    public List<AdminAuditEventDto> RecentActivity { get; set; } = new();
}

public class AdminDashboardCounts
{
    public int TotalUsers { get; set; }
    public int Patients { get; set; }
    public int Doctors { get; set; }
    public int Pharmacies { get; set; }
    public int Admins { get; set; }
    /// <summary>Pendings specifically for doctors.</summary>
    public int PendingDoctors { get; set; }

    /// <summary>Pendings specifically for pharmacies.</summary>
    public int PendingPharmacies { get; set; }

    /// <summary>Total pending approvals (doctors + pharmacies).</summary>
    public int PendingApprovalsTotal { get; set; }

    /// <summary>
    /// Backwards-compatibility alias for PendingApprovalsTotal.
    /// Kept so older clients that still read `pendingApprovals` continue to work.
    /// </summary>
    public int PendingApprovals { get; set; }
}
