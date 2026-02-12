using System.Net;
using MedicalRecords.Infrastructure.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedicalRecords.Api.Middleware;

/// <summary>
/// Centralized exception handling that returns RFC 7807 ProblemDetails.
/// Keeps success responses unchanged and prevents stack traces from leaking to clients.
/// </summary>
public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted)
            {
                // If the response has already started we can't change it safely.
                _logger.LogError(ex, "Unhandled exception after response started for {Path}", context.Request.Path);
                throw;
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var statusCode = MapStatusCode(ex);

        // Log full details server-side
        _logger.LogError(ex, "Unhandled exception processing {Path}", context.Request.Path);

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = GetClientSafeMessage(ex, statusCode),
            Instance = context.Request.Path
        };

        problem.Extensions["traceId"] = context.TraceIdentifier;

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problem);
    }

    private static int MapStatusCode(Exception ex) =>
        ex switch
        {
            AuthValidationException => StatusCodes.Status400BadRequest,
            ArgumentException => StatusCodes.Status400BadRequest,
            UnauthorizedAccessException => StatusCodes.Status403Forbidden,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            DbUpdateException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

    private static string GetTitle(int statusCode) =>
        statusCode switch
        {
            StatusCodes.Status400BadRequest => "Request invalid",
            StatusCodes.Status401Unauthorized => "Neautentificat",
            StatusCodes.Status403Forbidden => "Acces interzis",
            StatusCodes.Status404NotFound => "Resursa nu a fost găsită",
            StatusCodes.Status409Conflict => "Conflict de stare",
            _ => "Eroare internă de server"
        };

    private static string GetClientSafeMessage(Exception ex, int statusCode)
    {
        // Pentru coduri 4xx putem returna mesajul aplicației,
        // pentru 5xx folosim un mesaj generic.
        return statusCode >= 500
            ? "A apărut o eroare internă. Încearcă din nou mai târziu."
            : ex.Message;
    }
}

